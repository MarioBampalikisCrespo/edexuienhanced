# eDEX-UI (Secure Fork)

eDEX-UI is a fullscreen, cross-platform terminal emulator and system monitor that looks and feels like a sci-fi computer interface.  

This fork exists because the **original project contained a critical security vulnerability**:  
a local WebSocket server exposed the host shell without authentication, allowing **remote code execution (RCE)** if a malicious website connected to it.  

In this fork, **all WebSocket usage has been removed** and replaced with **Electron’s native IPC channels**, making the application safe for real-world usage.

---

<a href="https://youtu.be/BGeY1rK19zA">
  <img align="right" width="400" alt="Demo on YouTube" src="media/youtube-demo-teaser.gif">
</a>

Heavily inspired by the [TRON Legacy movie effects](https://web.archive.org/web/20170511000410/http://jtnimoy.com/blogs/projects/14881671) (especially the [Board Room sequence](https://gmunk.com/TRON-Board-Room)),  
eDEX-UI combines futuristic aesthetics with functional tools, bringing science-fiction UXs into reality.

---

<p align="center">
  <em>Jump to: <br><a href="#features">Features</a> — <a href="#screenshots">Screenshots</a> — <a href="#qa">Questions & Answers</a> — <strong><a href="#download">Download</a></strong> — <a href="#useful-commands-for-the-nerds">Developer Instructions</a> — <a href="#credits">Credits</a></em>
</p>

---

## Features

- Fully featured terminal emulator with tabs, colors, mouse events, and support for `curses` applications.
- Real-time system monitoring: CPU, RAM, swap, processes, and network (GeoIP, active connections, transfer rates).
- Touchscreen support, including an on-screen keyboard.
- Directory viewer that follows the terminal’s current working directory.
- Advanced customization: themes, keyboard layouts, CSS injection. See the [wiki](https://github.com/GitSquared/edex-ui/wiki).
- Optional sound effects for maximum cyberpunk vibe.
- **Security hardened**: WebSocket replaced with Electron IPC, removing all RCE vectors.

---

## Screenshots

![Default screenshot](media/screenshot_default.png)  
_Default "tron" theme with [neofetch](https://github.com/dylanaraps/neofetch)._

![Blade screenshot](media/screenshot_blade.png)  
_"blade" theme and [ranger](https://github.com/ranger/ranger) file manager._

![Disrupted screenshot](media/screenshot_disrupted.png)  
_"tron-disrupted" theme with [cmatrix](https://github.com/abishekvashok/cmatrix)."_

![Horizon screenshot](media/screenshot_horizon.png)  
_Editing code with `nvim` in the ["horizon-full"](https://github.com/GitSquared/horizon-edex-theme) theme._

---

## Q&A

#### How do I get it?
Head to the [Releases](https://github.com/YOUR-FORK/edex-ui/releases) page.  
⚠️ **Do not use the upstream GitSquared releases**, as they are permanently vulnerable.

#### I found a problem!
Open an issue in this repository. Security vulnerabilities should be reported privately (see [SECURITY.md](SECURITY.md)).

#### Can this run on ARM devices (e.g. Raspberry Pi)?
Yes — prebuilt arm64 builds are provided. For other architectures, build from source.

#### Is this repo actively maintained?
Yes — unlike the upstream repo (archived in 2021), this fork is actively maintained and patched.

---

## Useful commands for the nerds

**Note:** These instructions are for running from source. For stable builds, see [Releases](#download).

### Starting from source

On Linux/macOS:
```bash
git clone https://github.com/YOUR-FORK/edex-ui.git
cd edex-ui
npm run install-linux
npm run start
```

On Windows (run as Administrator):
```powershell
git clone https://github.com/YOUR-FORK/edex-ui.git
cd edex-ui
npm run install-windows
npm run start
```

### Building

Due to native modules, you can only build for the host OS.

```bash
npm install
npm run build-linux   # or build-windows / build-darwin
```

The build artifacts will be created in the `dist/` folder.

---

## Credits

Original project by [GitSquared](https://github.com/GitSquared).  
This fork is maintained with a focus on **security and long-term usability**.  

Other acknowledgements:
- [PixelyIon](https://github.com/PixelyIon) — Windows compatibility.
- [IceWolf](https://soundcloud.com/iamicewolf) — Sound design.  
- [Seena](https://github.com/seenaburns) — Inspiration from [DEX-UI](https://github.com/seenaburns/dex-ui).  
- [xterm.js](https://github.com/xtermjs/xterm.js), [systeminformation](https://github.com/sebhildebrandt/systeminformation), [SmoothieCharts](https://github.com/joewalnes/smoothie), and [ENCOM Globe](https://github.com/arscan/encom-globe) by [Rob "Arscan" Scanlon](https://github.com/arscan).

This project also depends on many open-source libraries, see the [full dependency graph](https://github.com/GitSquared/edex-ui/network/dependencies).

---

## Licensing

Licensed under the [GPLv3.0](https://github.com/YOUR-FORK/edex-ui/blob/master/LICENSE).
