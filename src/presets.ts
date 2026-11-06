import type { CompanionPresetDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { FeedbackId } from './feedbacks.js'
import * as Color from './colors.js'

// Status display buttons only: this module reads the device and never sends it commands.
export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}
	const label = self.label
	const display = (text: string, bgcolor: number, color = Color.White) => ({
		text,
		size: 'auto' as const,
		color,
		bgcolor,
	})

	// ──────────────── Device ────────────────

	presets['connection_status'] = {
		type: 'button',
		category: 'Device',
		name: 'Connection Status',
		style: display(`$(${label}:short_name)\\nOFFLINE`, Color.Red),
		steps: [],
		feedbacks: [
			{
				feedbackId: FeedbackId.DeviceConnected,
				options: {},
				style: { text: `$(${label}:short_name)\\nONLINE`, bgcolor: Color.DarkGreen, color: Color.White },
			},
		],
	}

	presets['device_info'] = {
		type: 'button',
		category: 'Device',
		name: 'Device Info',
		style: display(`$(${label}:short_name)\\n$(${label}:device_type)`, Color.DeviceBg),
		steps: [],
		feedbacks: [],
	}

	presets['firmware_version'] = {
		type: 'button',
		category: 'Device',
		name: 'Firmware Version',
		style: display(`FW\\n$(${label}:current_version)`, Color.Black, Color.LightGreen),
		steps: [],
		feedbacks: [],
	}

	// ──────────────── Process engines ────────────────

	const numPB = self.api?.processblocks.length || self.api?.deviceInfo?.nr_processblocks || 8
	for (let i = 1; i <= numPB; i++) {
		presets[`pe_${i}_active_input`] = {
			type: 'button',
			category: 'Process Engines',
			name: `PE ${i} Active Input`,
			style: display(`$(${label}:processblock_${i}_name)\\n$(${label}:processblock_${i}_active_input)`, Color.DeviceBg),
			steps: [],
			feedbacks: [
				{
					feedbackId: FeedbackId.ActiveInput,
					options: { processblock: i, slot: 1 },
					style: { bgcolor: Color.DarkGreen, color: Color.White },
				},
				{
					feedbackId: FeedbackId.ActiveInput,
					options: { processblock: i, slot: 2 },
					style: { bgcolor: Color.Orange, color: Color.White },
				},
				{
					feedbackId: FeedbackId.DeviceConnected,
					options: {},
					isInverted: true,
					style: { bgcolor: Color.DarkGrey, color: Color.Grey },
				},
			],
		}
		presets[`pe_${i}_source`] = {
			type: 'button',
			category: 'Process Engines',
			name: `PE ${i} Active Source (sender)`,
			style: display(`PE ${i}\\n$(${label}:processblock_${i}_active_source)`, Color.Black, Color.LightBlue),
			steps: [],
			feedbacks: [],
		}
		presets[`pe_${i}_mode`] = {
			type: 'button',
			category: 'Process Engines',
			name: `PE ${i} Mode`,
			style: display(`PE ${i}\\n$(${label}:processblock_${i}_mode)`, Color.Black),
			steps: [],
			feedbacks: [],
		}
	}

	// ──────────────── Playback & profile ────────────────

	presets['current_snapshot'] = {
		type: 'button',
		category: 'Playback',
		name: 'Current Snapshot',
		style: display(`NOW\\n$(${label}:current_snapshot)`, Color.PlaybackBg),
		steps: [],
		feedbacks: [],
	}
	presets['next_snapshot'] = {
		type: 'button',
		category: 'Playback',
		name: 'Next Snapshot',
		style: display(`NEXT\\n$(${label}:next_snapshot)`, Color.PlaybackBg),
		steps: [],
		feedbacks: [],
	}
	presets['active_profile'] = {
		type: 'button',
		category: 'Profiles',
		name: 'Active Profile',
		style: display(`PROFILE\\n$(${label}:active_profile_name)`, Color.ProfileBg),
		steps: [],
		feedbacks: [],
	}

	self.setPresetDefinitions(presets)
}
