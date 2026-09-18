// preload.js — bridges Node/Electron APIs into the renderer under contextIsolation.
// Runs with full Node access regardless of the page's nodeIntegration/contextIsolation
// settings; contextBridge exposes only the specific functions below to the page.

const { contextBridge, ipcRenderer, clipboard, shell, webFrame } = require("electron");
const remote = require("@electron/remote");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const net = require("net");
const mime = require("mime-types");
const color = require("color");
const geolite2 = require("geolite2-redist");
const maxmind = require("maxmind");
const prettyBytes = require("pretty-bytes");

// Channels this app actually uses. Keeps the ipc wrapper from becoming an
// arbitrary passthrough for whatever channel name a caller might construct.
const ALLOWED_CHANNELS = new Set([
    "log",
    "getThemeOverride", "setThemeOverride",
    "getKbOverride", "setKbOverride",
    "ttyspawn", "ttyspawn-reply",
    "systeminformation-call"
]);
function isAllowedChannel(channel) {
    if (ALLOWED_CHANNELS.has(channel)) return true;
    return /^(systeminformation-reply-|terminal_channel-|terminal_data-|terminal_closed-)/.test(channel);
}

function readJSONSync(filePath) {
    return JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
}

// Script-generated file, not worth rewriting as a <script>-loadable global —
// required here (preload has full Node access) and exposed as a plain function.
const matchFileIcon = require(path.join(__dirname, "assets/misc/file-icons-match.js"));

// --- color computation (the `color` package has no browser build) ---
function colorify(base, target, filterSteps) {
    if (Array.isArray(filterSteps) && filterSteps.length > 0) {
        let newColor = color(base);
        let targetColor = color(target);
        for (let i = 0; i < filterSteps.length; i++) {
            let step = filterSteps[i];
            if (step.func === "mix") {
                newColor = newColor.mix(targetColor, ...step.arg);
            } else {
                newColor = newColor[step.func](...step.arg);
            }
        }
        return newColor.hex();
    }
    return color(base).grayscale().mix(color(target), 0.3).hex();
}

// --- GeoIP (netstat.class.js) ---
let geoLookup = { get: () => null };
const geoipReady = geolite2.downloadDbs(path.join(remote.app.getPath("userData"), "geoIPcache")).then(() => {
    return geolite2.open("GeoLite2-City", p => maxmind.open(p));
}).then(lookup => {
    geoLookup = lookup;
});

// --- Shared https.Agent for external-IP checks (netstat.class.js) ---
const externalIpAgent = new https.Agent({ keepAlive: false, maxSockets: 10 });

function httpsGetJSON(options) {
    return new Promise((resolve, reject) => {
        https.get(options, res => {
            let rawData = "";
            res.on("data", chunk => { rawData += chunk; });
            res.on("end", () => {
                resolve({ statusCode: res.statusCode, body: rawData });
            });
        }).on("error", reject);
    });
}

contextBridge.exposeInMainWorld("api", {
    ipc: {
        send: (channel, ...args) => {
            if (!isAllowedChannel(channel)) throw new Error(`Blocked IPC channel: ${channel}`);
            ipcRenderer.send(channel, ...args);
        },
        on: (channel, cb) => {
            if (!isAllowedChannel(channel)) throw new Error(`Blocked IPC channel: ${channel}`);
            ipcRenderer.on(channel, (e, ...args) => cb(...args));
        },
        once: (channel, cb) => {
            if (!isAllowedChannel(channel)) throw new Error(`Blocked IPC channel: ${channel}`);
            ipcRenderer.once(channel, (e, ...args) => cb(...args));
        }
    },

    log: (level, message) => ipcRenderer.send("log", level, message),

    paths: {
        root: __dirname
    },
    path: {
        join: (...args) => path.join(...args),
        resolve: (...args) => path.resolve(...args)
    },

    fs: {
        readJSONSync,
        readFileSync: (p, encoding) => fs.readFileSync(p, encoding ? { encoding } : undefined).toString(encoding ? undefined : "utf-8"),
        existsSync: p => fs.existsSync(p),
        readdirSync: p => fs.readdirSync(p),
        writeFileSync: (p, data) => fs.writeFileSync(p, data),
        writeFile: (p, data, encoding) => new Promise((resolve, reject) => {
            fs.writeFile(p, data, encoding || "utf-8", err => err ? reject(err) : resolve());
        }),
        readdir: p => new Promise((resolve, reject) => {
            fs.readdir(p, (err, files) => err ? reject(err) : resolve(files));
        }),
        readFile: (p, encoding) => new Promise((resolve, reject) => {
            fs.readFile(p, encoding || "utf-8", (err, data) => err ? reject(err) : resolve(data));
        }),
        lstat: p => new Promise((resolve, reject) => {
            fs.lstat(p, (err, stat) => {
                if (err) return reject(err);
                resolve({
                    size: stat.size,
                    mtimeMs: stat.mtime.getTime(),
                    isDirectory: stat.isDirectory(),
                    isSymbolicLink: stat.isSymbolicLink(),
                    isFile: stat.isFile()
                });
            });
        }),
        watch: (p, cb) => {
            const watcher = fs.watch(p, (eventType, filename) => cb(eventType, filename));
            return { close: () => watcher.close() };
        }
    },

    os: {
        platform: () => os.platform(),
        uptime: () => os.uptime()
    },
    process: {
        platform: process.platform,
        versions: { electron: process.versions.electron },
        argv: remote.process.argv
    },

    mime: {
        lookup: p => mime.lookup(p),
        charset: mimeType => mime.charset(mimeType)
    },

    matchFileIcon,
    prettyBytes,

    clipboard: {
        readText: () => clipboard.readText(),
        writeText: text => clipboard.writeText(text)
    },
    shell: {
        openPath: p => shell.openPath(p),
        openExternal: url => shell.openExternal(url)
    },
    webFrame: {
        setZoomLimits: () => webFrame.setVisualZoomLevelLimits(1, 1)
    },

    colorify,

    username: () => require("username")(),
    // Electron 12 bundles Node 14.16, which predates crypto.randomUUID() (14.17+) —
    // randomBytes has been available since early Node and is plenty for correlation IDs.
    uuid: () => require("crypto").randomBytes(16).toString("hex"),

    remoteApp: {
        getVersion: () => remote.app.getVersion(),
        getPath: name => remote.app.getPath(name),
        focus: () => remote.app.focus(),
        relaunch: () => remote.app.relaunch(),
        quit: () => remote.app.quit()
    },

    currentWindow: (() => {
        const win = remote.getCurrentWindow();
        return {
            toggleDevTools: () => win.webContents.toggleDevTools(),
            isFullScreen: () => win.isFullScreen(),
            isMaximized: () => win.isMaximized(),
            unmaximize: () => win.unmaximize(),
            setFullScreen: v => win.setFullScreen(v),
            getSize: () => win.getSize(),
            setSize: (w, h) => win.setSize(w, h),
            minimize: () => win.minimize(),
            onResize: cb => win.on("resize", cb),
            onLeaveFullScreen: cb => win.on("leave-full-screen", cb)
        };
    })(),

    globalShortcut: {
        register: (trigger, fn) => remote.globalShortcut.register(trigger, fn),
        unregisterAll: () => remote.globalShortcut.unregisterAll()
    },

    screen: {
        getAllDisplays: () => remote.screen.getAllDisplays()
    },

    net: {
        ping: (target, port, local) => new Promise((resolve, reject) => {
            let s = new net.Socket();
            let start = process.hrtime();

            s.connect({ port, host: target, localAddress: local, family: 4 }, () => {
                let timeArr = process.hrtime(start);
                let time = (timeArr[0] * 1e9 + timeArr[1]) / 1e6;
                resolve(time);
                s.destroy();
            });
            s.on("error", e => {
                s.destroy();
                reject(e);
            });
            s.setTimeout(1900, () => {
                s.destroy();
                reject(new Error("Socket timeout"));
            });
        }),
        getExternalIP: localAddress => httpsGetJSON({
            host: "myexternalip.com",
            port: 443,
            path: "/json",
            localAddress,
            agent: externalIpAgent
        }).then(({ body }) => JSON.parse(body))
    },

    geoip: {
        ready: geoipReady,
        get: ip => geoLookup.get(ip)
    },

    checkForUpdate: () => httpsGetJSON({
        protocol: "https:",
        host: "api.github.com",
        path: "/repos/GitSquared/edex-ui/releases/latest",
        headers: { "User-Agent": "eDEX-UI UpdateChecker" }
    }).then(({ statusCode, body }) => {
        if (statusCode === 404) throw new Error("Got 404 (Not Found) response from server");
        if (statusCode !== 200) throw new Error(body.toString());
        return JSON.parse(body.toString());
    })
});
