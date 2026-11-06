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
				<strong>Read-only:</strong> this module only reads status through the documented WebApi (v2.8.1 GET
				requests) and never sends the device commands. One request at a time, 3 s timeout; when the device
				is unreachable it retries less often (up to every 30 s) and reconnects on its own.<br>
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
			tooltip: 'How often to read process engine status (one request for all engines)',
			default: 2000,
			min: 1000,
			max: 30000,
			width: 6,
		},
	]
}
