# Luminex LumiNode / LumiCore

This module controls Luminex LumiNode and LumiCore network DMX devices via their REST API and WebSocket interface.

## Configuration

- **Device IP**: The IP address of your LumiNode or LumiCore device.
- **Password**: Only required if authentication is enabled on the device. Uses HTTP Basic Auth with the `admin` username.
- **Polling Interval**: How often to poll the device for status updates (default: 5 seconds). Only used when WebSocket is not available.

## Features

### Device Control
- Identify device (flash LEDs)
- Reboot device
- Factory reset (with options to keep IP settings and user profiles)
- Toggle LCD display on/off

### Profile Management
- Recall any of the 40 profile slots
- Save current configuration to any profile slot
- View active profile name and all profile names as variables

### Playback / Snapshots
- Go (play next cue)
- Forward / Back (navigate cue list)
- Reset (return to first cue)
- Play a specific snapshot by ID
- Feedbacks for currently playing and next staged cue

### DMX / RDM
- Acknowledge stream loss on all ports or a specific port
- Force RDM discovery on all ports or a specific port

### Process Engines
- View process engine names, colors, and modes as variables
- Monitor active input sources

### WebSocket Support
Devices running firmware v2.7.0 or later support WebSocket connections for real-time state updates, reducing the need for polling and providing instant feedback.

## Requirements

- Luminex LumiNode or LumiCore device
- Firmware v2.4.0 or later recommended (v2.7.0+ for WebSocket support)
- Network connectivity between Companion and the device
