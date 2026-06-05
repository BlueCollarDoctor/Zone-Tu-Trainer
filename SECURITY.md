# Security Policy

## Supported Versions

This is a client-side PWA with no backend. The latest version on the `main` branch is always the supported version.

| Version | Supported |
|---------|-----------|
| main (latest) | Yes |
| Older commits | No |

## Reporting a Vulnerability

If you discover a security vulnerability in Zone Tu Trainer, please do not open a public GitHub issue.

Instead, report it privately via the Security tab of this repository and click "Report a vulnerability" to open a private advisory. Describe the vulnerability, steps to reproduce, and potential impact.

You can expect an acknowledgment within 48 hours and a resolution or status update within 7 days.

## Security Considerations

This app runs entirely in the browser (no server, no user accounts, no data storage):

- No data is collected or transmitted — heart rate data stays on your device
- Bluetooth access is only requested when you tap "Connect BLE HR Monitor" — the browser will prompt for permission
- No cookies or localStorage are used
- No third-party scripts are loaded

## Content Security Policy

The app uses a strict Content Security Policy defined in index.html to mitigate XSS and data injection attacks.

## Responsible Disclosure

We follow responsible disclosure principles. Please give us a reasonable amount of time to fix reported issues before any public disclosure.
