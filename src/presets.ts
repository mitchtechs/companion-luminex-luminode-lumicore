import type { CompanionPresetDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { ActionId } from './actions.js'
import { FeedbackId } from './feedbacks.js'
import * as Color from './colors.js'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}
	const label = self.label

	// ──────────────── Device Control ────────────────

	presets['identify'] = {
		type: 'button',
		category: 'Device',
		name: 'Identify Device',
		style: {
			text: 'Identify',
			size: 'auto',
			color: Color.White,
			bgcolor: Color.Blue,
		},
		steps: [{ down: [{ actionId: ActionId.Identify, options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['reboot'] = {
		type: 'button',
		category: 'Device',
		name: 'Reboot Device',
		style: {
			text: `Reboot\\n$(${label}:short_name)`,
			size: 'auto',
			color: Color.White,
			bgcolor: Color.DarkGrey,
		},
		steps: [{ down: [{ actionId: ActionId.Reboot, options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['reset'] = {
		type: 'button',
		category: 'Device',
		name: 'Factory Reset (Keep IP & Profiles)',
		style: {
			text: `Reset\\n$(${label}:short_name)`,
			size: 'auto',
			color: Color.White,
			bgcolor: Color.Red,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.Reset,
						options: { keep_ip_settings: true, keep_user_profiles: true },
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['display_on'] = {
		type: 'button',
		category: 'Device',
		name: 'Display On',
		style: {
			text: 'Display\\nON',
			size: 'auto',
			color: Color.White,
			bgcolor: Color.DarkGreen,
		},
		steps: [
			{
				down: [{ actionId: ActionId.DisplayToggle, options: { display_on: true } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['display_off'] = {
		type: 'button',
		category: 'Device',
		name: 'Display Off',
		style: {
			text: 'Display\\nOFF',
			size: 'auto',
			color: Color.White,
			bgcolor: Color.DarkGrey,
		},
		steps: [
			{
				down: [{ actionId: ActionId.DisplayToggle, options: { display_on: false } }],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['device_info'] = {
		type: 'button',
		category: 'Device',
		name: 'Device Info',
		style: {
			text: `$(${label}:short_name)\\n$(${label}:device_type)`,
			size: 'auto',
			color: Color.White,
			bgcolor: Color.Black,
		},
		steps: [{ down: [{ actionId: ActionId.Identify, options: {} }], up: [] }],
		feedbacks: [
			{
				feedbackId: FeedbackId.DeviceConnected,
				options: {},
				style: { bgcolor: Color.DarkGreen },
			},
		],
	}

	presets['firmware_version'] = {
		type: 'button',
		category: 'Device',
		name: 'Firmware Version',
		style: {
			text: `FW\\n$(${label}:current_version)`,
			size: 'auto',
			color: Color.LightGreen,
			bgcolor: Color.Black,
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	}

	// ──────────────── Playback ────────────────

	presets['play_go'] = {
		type: 'button',
		category: 'Playback',
		name: 'Go (Play Next Cue)',
		style: {
			text: 'GO',
			size: 'auto',
			color: Color.Black,
			bgcolor: Color.Green,
		},
		steps: [{ down: [{ actionId: ActionId.PlayGo, options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['play_back'] = {
		type: 'button',
		category: 'Playback',
		name: 'Back',
		style: {
			text: 'BACK',
			size: 'auto',
			color: Color.Yellow,
			bgcolor: Color.Black,
		},
		steps: [{ down: [{ actionId: ActionId.PlayBack, options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['play_forward'] = {
		type: 'button',
		category: 'Playback',
		name: 'Forward (Next)',
		style: {
			text: 'NEXT',
			size: 'auto',
			color: Color.Yellow,
			bgcolor: Color.Black,
		},
		steps: [{ down: [{ actionId: ActionId.PlayForward, options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['play_reset'] = {
		type: 'button',
		category: 'Playback',
		name: 'Reset Player',
		style: {
			text: 'RESET',
			size: 'auto',
			color: Color.Orange,
			bgcolor: Color.Black,
		},
		steps: [{ down: [{ actionId: ActionId.PlayReset, options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['current_snapshot'] = {
		type: 'button',
		category: 'Playback',
		name: 'Current Snapshot Display',
		style: {
			text: `Playing\\n$(${label}:current_snapshot)`,
			size: 'auto',
			color: Color.White,
			bgcolor: Color.DarkGrey,
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	}

	presets['next_snapshot'] = {
		type: 'button',
		category: 'Playback',
		name: 'Next Snapshot Display',
		style: {
			text: `Next\\n$(${label}:next_snapshot)`,
			size: 'auto',
			color: Color.Yellow,
			bgcolor: Color.DarkGrey,
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	}

	// Snapshot trigger presets (1.00 through 10.00)
	for (let i = 1; i <= 10; i++) {
		const snapshotId = `${i}.00`
		presets[`play_snapshot_${i}`] = {
			type: 'button',
			category: 'Playback',
			name: `Play Snapshot ${snapshotId}`,
			style: {
				text: `Snap\\n${snapshotId}`,
				size: 'auto',
				color: Color.Green,
				bgcolor: Color.Black,
			},
			steps: [
				{
					down: [{ actionId: ActionId.PlaySnapshot, options: { snapshot_id: snapshotId } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: FeedbackId.PlayingCue,
					options: { snapshot_id: snapshotId },
					style: { color: Color.White, bgcolor: Color.Red },
				},
				{
					feedbackId: FeedbackId.NextCue,
					options: { snapshot_id: snapshotId },
					style: { color: Color.White, bgcolor: Color.Orange },
				},
			],
		}
	}

	// ──────────────── Profiles ────────────────

	presets['active_profile'] = {
		type: 'button',
		category: 'Profiles',
		name: 'Active Profile Name',
		style: {
			text: `Profile\\n$(${label}:active_profile_name)`,
			size: 'auto',
			color: Color.LightGreen,
			bgcolor: Color.Black,
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	}

	// Recall & Save presets for all 40 profiles
	for (let i = 1; i <= 40; i++) {
		presets[`recall_profile_${i}`] = {
			type: 'button',
			category: 'Profiles',
			name: `Recall Profile ${i}`,
			style: {
				text: `Recall\\n$(${label}:profile_${i}_name)`,
				size: 'auto',
				color: Color.LightBlue,
				bgcolor: Color.Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ActionId.RecallProfile,
							options: { profile: i, keep_ip_settings: true },
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`save_profile_${i}`] = {
			type: 'button',
			category: 'Profiles',
			name: `Save to Profile ${i}`,
			style: {
				text: `Save\\nP${i}`,
				size: 'auto',
				color: Color.Yellow,
				bgcolor: Color.Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ActionId.SaveProfile,
							options: { profile: i, name: `Profile ${i}` },
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	// ──────────────── DMX / RDM ────────────────

	presets['dmx_ack_all'] = {
		type: 'button',
		category: 'DMX',
		name: 'Acknowledge All Stream Loss',
		style: {
			text: 'ACK All\\nStream Loss',
			size: 'auto',
			color: Color.White,
			bgcolor: Color.Orange,
		},
		steps: [{ down: [{ actionId: ActionId.DmxAcknowledgeAll, options: {} }], up: [] }],
		feedbacks: [],
	}

	presets['rdm_discovery_all'] = {
		type: 'button',
		category: 'DMX',
		name: 'Force RDM Discovery All',
		style: {
			text: 'RDM\\nDiscover All',
			size: 'auto',
			color: Color.White,
			bgcolor: Color.Purple,
		},
		steps: [{ down: [{ actionId: ActionId.RdmDiscoveryAll, options: {} }], up: [] }],
		feedbacks: [],
	}

	// Per-port DMX presets (up to 12 ports)
	const maxPorts = self.api?.deviceInfo?.nr_dmx_ports ?? 12
	for (let port = 1; port <= maxPorts; port++) {
		presets[`dmx_ack_port_${port}`] = {
			type: 'button',
			category: 'DMX',
			name: `Acknowledge Stream Loss Port ${port}`,
			style: {
				text: `ACK\\nPort ${port}`,
				size: 'auto',
				color: Color.White,
				bgcolor: Color.DarkGrey,
			},
			steps: [
				{
					down: [{ actionId: ActionId.DmxAcknowledgePort, options: { port } }],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`rdm_discovery_port_${port}`] = {
			type: 'button',
			category: 'DMX',
			name: `Force RDM Discovery Port ${port}`,
			style: {
				text: `RDM\\nPort ${port}`,
				size: 'auto',
				color: Color.White,
				bgcolor: Color.DarkGrey,
			},
			steps: [
				{
					down: [{ actionId: ActionId.RdmDiscoveryPort, options: { port } }],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	// ──────────────── Process Engines ────────────────

	const numPB = self.api?.deviceInfo?.nr_processblocks ?? 8
	const modes = ['HTP', 'LTP', 'Crossfade', 'Backup', 'Switch']

	for (let pb = 1; pb <= numPB; pb++) {
		// Info display preset
		presets[`processblock_${pb}_info`] = {
			type: 'button',
			category: 'Process Engines',
			name: `Process Engine ${pb} Info`,
			style: {
				text: `PE${pb}\\n$(${label}:processblock_${pb}_name)\\n$(${label}:processblock_${pb}_mode)`,
				size: 'auto',
				color: Color.White,
				bgcolor: Color.DarkGrey,
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [],
		}

		// Active input display preset
		presets[`processblock_${pb}_active_input`] = {
			type: 'button',
			category: 'Process Engines',
			name: `Process Engine ${pb} Active Input`,
			style: {
				text: `PE${pb} Input\\n$(${label}:processblock_${pb}_active_input)`,
				size: 'auto',
				color: Color.LightGreen,
				bgcolor: Color.Black,
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: FeedbackId.ProcessBlockMode,
					options: { processblock: pb, mode: 'Switch' },
					style: { bgcolor: Color.DarkGreen },
				},
			],
		}

		// Mode switching presets
		for (const mode of modes) {
			presets[`processblock_${pb}_mode_${mode.toLowerCase()}`] = {
				type: 'button',
				category: 'Process Engines',
				name: `PE ${pb}: Set ${mode}`,
				style: {
					text: `PE${pb}\\n${mode}`,
					size: 'auto',
					color: Color.White,
					bgcolor: Color.DarkGrey,
				},
				steps: [
					{
						down: [
							{
								actionId: ActionId.SetProcessBlockMode,
								options: { processblock: pb, mode },
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: FeedbackId.ProcessBlockMode,
						options: { processblock: pb, mode },
						style: { bgcolor: Color.Blue, color: Color.White },
					},
				],
			}
		}
	}

	self.setPresetDefinitions(presets)
}
