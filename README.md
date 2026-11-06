# Companion Module — Luminex LumiNode / LumiCore

Read-only status monitor for Luminex LumiNode and LumiCore network DMX devices in [Bitfocus Companion](https://bitfocus.io/companion). It never sends the device commands.

Developed by **[PDA Technical Limited](https://pda-tech.com)** — Mitch Bailey.

---

## Supported Devices

- **LumiNode** — Network DMX processor
- **LumiCore** — Network DMX process engine

---

## Features

### Variables
- Device name, type, serial, firmware (current and alternate)
- Per process engine: name, mode, inputs, **active input** (Switch/Backup modes), the **source** sending to it, active input number
- Active profile (and whether it's modified), profile names
- Playback: current and next snapshot

### Feedbacks
- Active input on a process engine (Input 1–4)
- Process engine mode, active profile, playing / next snapshot, device connected

### Presets
- Status displays only: connection, device info, firmware, per-engine active input / source / mode, playback, profile

### Actions
- None. Use the separate switcher module or the device itself to change anything.

---

## Configuration

| Field | Description |
|-------|-------------|
| Host | IP address of the LumiNode / LumiCore device |
| Password | Device admin password (if set) |
| Polling Interval | How often to read process engine status, default 2000 ms |

---

## Connection

Only documented GET endpoints from the Luminex LumiNode/LumiCore WebApi v2.8.1:

| Endpoint | When |
|---|---|
| `/api/software/version`, `/api/deviceinfo` | once per connection |
| `/api/IO`, `/api/profile`, `/api/active_profile_name` | every 30 s |
| `/api/processblock` (all engines in one request) | every poll |
| `/api/play/player/{id}` | every poll, only if a player IO exists |

One request at a time with a 3 s timeout. When the device stops answering, the gap between tries doubles up to 30 s, and the module reconnects on its own. Variables and feedbacks only update when a value changes.

---

## License

MIT — © PDA Technical Limited
