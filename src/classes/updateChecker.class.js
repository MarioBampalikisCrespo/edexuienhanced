class UpdateChecker {
    constructor() {
        let current = window.api.remoteApp.getVersion();

        this._fail = e => {
            window.api.log("note", "UpdateChecker: Could not fetch latest release from GitHub's API.");
            window.api.log("debug", `Error: ${e}`);
        };

        window.api.checkForUpdate().then(release => {
            if (release.tag_name.slice(1) === current) {
                window.api.log("info", "UpdateChecker: Running latest version.");
            } else if (Number(release.tag_name.slice(1).replace(/\./g, "")) < Number(current.replace("-pre", "").replace(/\./g, ""))) {
                window.api.log("info", "UpdateChecker: Running an unreleased, development version.");
            } else {
                new Modal({
                    type: "info",
                    title: "New version available",
                    message: `eDEX-UI <strong>${release.tag_name}</strong> is now available.<br/>Head over to <a href="#" onclick="window.api.shell.openExternal('${release.html_url}')">github.com</a> to download the latest version.`
                });
                window.api.log("info", `UpdateChecker: New version ${release.tag_name} available.`);
            }
        }).catch(e => {
            this._fail(e);
        });
    }
}
