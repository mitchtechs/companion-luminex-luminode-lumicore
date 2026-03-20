import type { SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	luminode_host: string
	host: string
	password: string
	pollInterval: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
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
