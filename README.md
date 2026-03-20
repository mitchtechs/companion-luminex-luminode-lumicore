# Companion Module — Luminex LumiNode / LumiCore

Control Luminex LumiNode and LumiCore network DMX devices from [Bitfocus Companion](https://bitfocus.io/companion).

Developed by **[PDA Technical Limited](https://pda-tech.com)** — Mitch Bailey.

---

## Supported Devices

- **LumiNode** — Network DMX processor
- **LumiCore** — Network DMX process engine

---

## Features

### Actions
- Set input source for a DMX universe
- Enable / disable a universe output
- Set merge mode (HTP / LTP)
- Reboot device

### Feedbacks
- Universe active status
- Input source indicator
- Connection status

### Variables
- Device name, firmware version
- Per-universe input source, merge mode, active status

### Presets
- Pre-built buttons for common universe switching and status monitoring

---

## Configuration

| Field | Description |
|-------|-------------|
| Host | IP address of the LumiNode / LumiCore device |
| Password | Device admin password (if set) |

---

## Connection

The module connects via the Luminex REST API and WebSocket for real-time state updates.

---

## License

MIT — © PDA Technical Limited
