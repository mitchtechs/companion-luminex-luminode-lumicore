import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export enum ActionId {
	// Device
	Identify = 'identify',
	Reboot = 'reboot',
	Reset = 'reset',
	DisplayToggle = 'display_toggle',

	// Profiles
	RecallProfile = 'recall_profile',
	SaveProfile = 'save_profile',

	// DMX / RDM
	DmxAcknowledgeAll = 'dmx_acknowledge_all',
	DmxAcknowledgePort = 'dmx_acknowledge_port',
	RdmDiscoveryAll = 'rdm_discovery_all',
	RdmDiscoveryPort = 'rdm_discovery_port',

	// Playback
	PlayGo = 'play_go',
	PlayForward = 'play_forward',
	PlayBack = 'play_back',
	PlayReset = 'play_reset',
	PlaySnapshot = 'play_snapshot',

	// Process Blocks
	SetProcessBlockMode = 'set_processblock_mode',
	SetProcessBlockName = 'set_processblock_name',
}

export function UpdateActions(self: ModuleInstance): void {
	const api = self.api
	if (!api) {
		self.setActionDefinitions({})
		return
	}

	const maxPorts = api.deviceInfo?.nr_dmx_ports ?? 12
	const maxPB = api.deviceInfo?.nr_processblocks ?? 16

	const processBlockModes = [
		{ id: 'HTP', label: 'HTP (Highest Takes Precedence)' },
		{ id: 'LTP', label: 'LTP (Latest Takes Precedence)' },
		{ id: 'Crossfade', label: 'Crossfade' },
		{ id: 'Backup', label: 'Backup' },
		{ id: 'Switch', label: 'Switch' },
		{ id: 'Custom', label: 'Custom' },
	]

	const actions: CompanionActionDefinitions = {
		// ──────────────── Device Control ────────────────

		[ActionId.Identify]: {
			name: 'Identify Device',
			description: 'Flash the device LEDs for identification',
			options: [],
			callback: async () => {
				await api.sendCommand('identify', 'GET')
			},
		},

		[ActionId.Reboot]: {
			name: 'Reboot Device',
			description: 'Reboot the device',
			options: [],
			callback: async () => {
				await api.sendCommand('reboot', 'POST')
			},
		},

		[ActionId.Reset]: {
			name: 'Factory Reset Device',
			description: 'Reset the device to factory defaults',
			options: [
				{
					id: 'keep_ip_settings',
					type: 'checkbox',
					label: 'Keep IP Settings',
					default: true,
				},
				{
					id: 'keep_user_profiles',
					type: 'checkbox',
					label: 'Keep User Profiles',
					default: true,
				},
			],
			callback: async (action) => {
				await api.sendCommand('reset', 'POST', {
					keep_ip_settings: Boolean(action.options.keep_ip_settings),
					keep_user_profiles: Boolean(action.options.keep_user_profiles),
				})
			},
		},

		[ActionId.DisplayToggle]: {
			name: 'Display On/Off',
			description: 'Turn the LCD display on or off',
			options: [
				{
					id: 'display_on',
					type: 'checkbox',
					label: 'Display On',
					default: true,
				},
			],
			callback: async (action) => {
				await api.sendCommand('display', 'POST', {
					display_on: Boolean(action.options.display_on),
				})
			},
		},

		// ──────────────── Profile Management ────────────────

		[ActionId.RecallProfile]: {
			name: 'Recall Profile',
			description: 'Recall a saved configuration profile',
			options: [
				{
					type: 'number',
					id: 'profile',
					label: 'Profile Number',
					tooltip: 'Profile slot (1-40)',
					default: 1,
					min: 1,
					max: 40,
				},
				{
					id: 'keep_ip_settings',
					type: 'checkbox',
					label: 'Keep IP Settings',
					default: true,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.profile) - 1
				await api.sendCommand(`profile/${idx}/recall`, 'POST', {
					keep_ip_settings: Boolean(action.options.keep_ip_settings),
				})
			},
		},

		[ActionId.SaveProfile]: {
			name: 'Save Profile',
			description: 'Save the current configuration to a profile slot',
			options: [
				{
					type: 'number',
					id: 'profile',
					label: 'Profile Number',
					tooltip: 'Profile slot (1-40)',
					default: 1,
					min: 1,
					max: 40,
				},
				{
					type: 'textinput',
					id: 'name',
					label: 'Profile Name',
					default: 'Profile',
					useVariables: true,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.profile) - 1
				const name = String(action.options.name ?? 'Profile')
				await api.sendCommand(`profile/${idx}/save`, 'POST', { name })
			},
		},

		// ──────────────── DMX / RDM ────────────────

		[ActionId.DmxAcknowledgeAll]: {
			name: 'Acknowledge All Stream Loss',
			description: 'Acknowledge stream loss indications on all DMX ports',
			options: [],
			callback: async () => {
				await api.sendCommand('dmx/acknowledge', 'POST')
			},
		},

		[ActionId.DmxAcknowledgePort]: {
			name: 'Acknowledge Stream Loss (Port)',
			description: 'Acknowledge stream loss on a specific DMX port',
			options: [
				{
					type: 'number',
					id: 'port',
					label: 'DMX Port',
					tooltip: 'Port number (1-based)',
					default: 1,
					min: 1,
					max: maxPorts,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.port) - 1
				await api.sendCommand(`dmx/${idx}/acknowledge`, 'POST')
			},
		},

		[ActionId.RdmDiscoveryAll]: {
			name: 'Force RDM Discovery (All)',
			description: 'Force RDM discovery on all DMX ports',
			options: [],
			callback: async () => {
				await api.sendCommand('dmx/force_discovery', 'POST')
			},
		},

		[ActionId.RdmDiscoveryPort]: {
			name: 'Force RDM Discovery (Port)',
			description: 'Force RDM discovery on a specific DMX port',
			options: [
				{
					type: 'number',
					id: 'port',
					label: 'DMX Port',
					tooltip: 'Port number (1-based)',
					default: 1,
					min: 1,
					max: maxPorts,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.port) - 1
				await api.sendCommand(`dmx/${idx}/force_discovery`, 'POST')
			},
		},

		// ──────────────── Playback ────────────────

		[ActionId.PlayGo]: {
			name: 'Playback: Go',
			description: 'Play the next cue in the queue',
			options: [],
			callback: async () => {
				await api.sendCommand('play/control', 'POST', { action: 'go' })
			},
		},

		[ActionId.PlayForward]: {
			name: 'Playback: Forward',
			description: 'Move the next cue pointer forward',
			options: [],
			callback: async () => {
				await api.sendCommand('play/control', 'POST', { action: 'forward' })
			},
		},

		[ActionId.PlayBack]: {
			name: 'Playback: Back',
			description: 'Move the next cue pointer back',
			options: [],
			callback: async () => {
				await api.sendCommand('play/control', 'POST', { action: 'back' })
			},
		},

		[ActionId.PlayReset]: {
			name: 'Playback: Reset',
			description: 'Reset the player to the first cue',
			options: [],
			callback: async () => {
				await api.sendCommand('play/control', 'POST', { action: 'reset' })
			},
		},

		[ActionId.PlaySnapshot]: {
			name: 'Play Snapshot',
			description: 'Play a specific snapshot by its ID',
			options: [
				{
					type: 'textinput',
					id: 'snapshot_id',
					label: 'Snapshot ID',
					default: '1.00',
					useVariables: true,
				},
			],
			callback: async (action) => {
				await api.sendCommand('play/play_snapshot', 'POST', {
					snapshot_id: String(action.options.snapshot_id),
				})
			},
		},

		// ──────────────── Process Blocks ────────────────

		[ActionId.SetProcessBlockMode]: {
			name: 'Set Process Engine Mode',
			description: 'Change the merge mode of a process engine',
			options: [
				{
					type: 'number',
					id: 'processblock',
					label: 'Process Engine',
					tooltip: 'Process engine number (1-based)',
					default: 1,
					min: 1,
					max: maxPB,
				},
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'HTP',
					choices: processBlockModes,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.processblock) - 1
				await api.sendCommand(`processblock/${idx}`, 'PATCH', {
					mode: String(action.options.mode),
				})
			},
		},

		[ActionId.SetProcessBlockName]: {
			name: 'Set Process Engine Name',
			description: 'Rename a process engine',
			options: [
				{
					type: 'number',
					id: 'processblock',
					label: 'Process Engine',
					tooltip: 'Process engine number (1-based)',
					default: 1,
					min: 1,
					max: maxPB,
				},
				{
					type: 'textinput',
					id: 'name',
					label: 'Name',
					default: '',
					useVariables: true,
				},
			],
			callback: async (action) => {
				const idx = Number(action.options.processblock) - 1
				await api.sendCommand(`processblock/${idx}`, 'PATCH', {
					name: String(action.options.name),
				})
			},
		},
	}

	self.setActionDefinitions(actions)
}
