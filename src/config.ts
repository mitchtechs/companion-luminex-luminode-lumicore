import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	luminode_host: string
	host: string
	password: string
	pollInterval: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		// ── Compatibility Notice ──────────────────────────────────────────────
		{
			type: 'static-text',
			id: 'compat-notice',
			width: 12,
			label: 'Hardware Compatibility',
			value: `
				<strong>Supported devices:</strong> Luminex LumiNode and LumiCore — all variants.<br>
				<strong>Firmware requirements:</strong> v2.4.0 or later recommended. v2.7.0 or later required for
				WebSocket support (real-time updates). Older firmware falls back to HTTP polling automatically.<br>
				<strong>Auto-discovery:</strong> If your device appears in the dropdown below, select it for
				automatic connection. Otherwise enter the IP address manually. Discovery requires the device
				and this computer to be on the same network with mDNS/Bonjour enabled.
			`.replace(/\t/g, '').trim(),
		},

		// ── Auto-discovery ────────────────────────────────────────────────────
		{
			type: 'bonjour-device',
			id: 'luminode_host',
			label: 'LumiNode / LumiCore',
			width: 6,
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Device IP',
			isVisible: (options) => !options['luminode_host'],
			width: 6,
		},
		{
			type: 'static-text',
			id: 'host-filler',
			width: 6,
			label: '',
			isVisible: (options) => !!options['luminode_host'],
			value: '',
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			tooltip: 'Only required when authentication is enabled on the device',
			width: 6,
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Polling Interval (ms)',
			tooltip: 'How often to poll the device when WebSocket is not available',
			default: 5000,
			min: 1000,
			max: 30000,
			width: 6,
		},
	]
}
