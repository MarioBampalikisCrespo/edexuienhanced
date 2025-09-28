# Security Policy

## Supported Versions

Only the versions released in this fork are maintained and supported.  
The original upstream repository (`GitSquared/edex-ui`) is archived and unmaintained.

| Version             | Supported |
|---------------------|-----------|
| Fork releases (>=1) | ✅        |
| Upstream releases   | ❌        |

---

## Reporting a Vulnerability

If you discover a security issue in this project, please open a **private security advisory** on GitHub or contact the maintainer directly.  
Please **do not disclose the issue publicly** until it has been confirmed and patched.

---

## Known Vulnerabilities in Upstream

The original implementation of eDEX-UI contained a **critical Remote Code Execution (RCE) vulnerability**:

- A **local WebSocket server** was opened by default and bound to the pseudo-terminal (PTY).  
- This WebSocket was exposed on a TCP port without authentication.  
- Any malicious website visited by the user could attempt to connect to this port.  
- Once connected, attackers could send arbitrary input that would be executed by the underlying shell.  

This design flaw has been assigned a **CVE** and makes **all upstream builds unsafe to use** in any environment connected to a network.

---

## Fixes applied into this fork

### Replacement of insecure WebSocket with Electron IPC

All WebSocket usage has been completely removed.  
Instead, communication between the renderer (UI) and the main process (PTY handler) is now handled via **Electron’s native IPC channels** (`ipcMain` / `ipcRenderer`).

**Why this matters:**

- 🔒 No open ports → zero network attack surface.  
- ✅ Communication is strictly process-internal.  
- 🛡️ IPC usage follows Electron Security Guidelines:  
  - `contextIsolation: true`  
  - `nodeIntegration: false`  
  - Input validation on IPC handlers  

### Impact

This fix **eliminates the remote code execution vector entirely**.  
Users of this fork are safe from the vulnerability that affects upstream.

---

## Recommendations

- **Do not use** any of the upstream builds (`GitSquared/edex-ui`), as they are permanently vulnerable.  
- Always download releases from this fork.  
- Keep your Electron runtime up to date to benefit from the latest security patches.  
- If you embed or redistribute this project, make sure to apply these patches or base your distribution on this fork.

---

## Acknowledgements

Special thanks to the community members who reported and analyzed the vulnerability.  
Security research and responsible disclosure are highly valued and help keep the ecosystem safe.
