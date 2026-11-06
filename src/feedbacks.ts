import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import * as Color from './colors.js'

export enum FeedbackId {
	PlayingCue = 'playing_cue',
	NextCue = 'next_cue',
	ActiveProfile = 'active_profile',
	ProcessBlockMode = 'processblock_mode',
	ActiveInput = 'active_input',
	DeviceConnected = 'device_connected',
}

const processEngineOption = {
	type: 'number' as const,
	id: 'processblock',
	label: 'Process Engine',
	tooltip: 'Process engine number (1-based)',
	default: 1,
	min: 1,
	max: 64,
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {
		[FeedbackId.PlayingCue]: {
			type: 'boolean',
			name: 'Cue Is Playing',
			description: 'Change style when a specific snapshot is playing',
			defaultStyle: { bgcolor: Color.Green, color: Color.White },
			options: [{ type: 'textinput', id: 'snapshot_id', label: 'Snapshot ID', default: '1' }],
			callback: (feedback) => self.api?.currentSnapshot === feedback.options.snapshot_id,
		},

		[FeedbackId.NextCue]: {
			type: 'boolean',
			name: 'Cue Is Staged Next',
			description: 'Change style when a specific snapshot is staged next',
			defaultStyle: { bgcolor: Color.Orange, color: Color.White },
			options: [{ type: 'textinput', id: 'snapshot_id', label: 'Snapshot ID', default: '1' }],
			callback: (feedback) => self.api?.nextSnapshot === feedback.options.snapshot_id,
		},

		[FeedbackId.ActiveProfile]: {
			type: 'boolean',
			name: 'Active Profile',
			description: 'Change style when a specific profile is active',
			defaultStyle: { bgcolor: Color.Green, color: Color.White },
			options: [{ type: 'textinput', id: 'profile_name', label: 'Profile Name', default: '' }],
			callback: (feedback) => self.api?.activeProfile === feedback.options.profile_name,
		},

		[FeedbackId.ProcessBlockMode]: {
			type: 'boolean',
			name: 'Process Engine Mode',
			description: 'Change style when a process engine is in a specific mode',
			defaultStyle: { bgcolor: Color.Blue, color: Color.White },
			options: [
				processEngineOption,
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'HTP',
					choices: [
						{ id: 'HTP', label: 'HTP' },
						{ id: 'LTP', label: 'LTP' },
						{ id: 'XFADE', label: 'Crossfade' },
						{ id: 'BACKUP', label: 'Backup' },
						{ id: 'SWITCH', label: 'Switch' },
						{ id: 'CUSTOM', label: 'Custom' },
						{ id: 'REROUTE', label: 'Reroute' },
						{ id: 'NONE', label: 'None' },
					],
				},
			],
			callback: (feedback) => {
				const pb = self.api?.processblocks[Number(feedback.options.processblock) - 1]
				return pb?.mode === feedback.options.mode
			},
		},

		[FeedbackId.ActiveInput]: {
			type: 'boolean',
			name: 'Active Input',
			description: 'Change style when a given input is the active one on a process engine (Switch and Backup modes)',
			defaultStyle: { bgcolor: Color.Green, color: Color.White },
			options: [
				processEngineOption,
				{
					type: 'dropdown',
					id: 'slot',
					label: 'Input',
					default: 1,
					choices: [
						{ id: 1, label: 'Input 1 (main)' },
						{ id: 2, label: 'Input 2 (backup)' },
						{ id: 3, label: 'Input 3' },
						{ id: 4, label: 'Input 4' },
					],
				},
			],
			callback: (feedback) => {
				const slot = self.api?.activeSlots.get(Number(feedback.options.processblock) - 1)
				return slot !== null && slot !== undefined && slot + 1 === Number(feedback.options.slot)
			},
		},

		[FeedbackId.DeviceConnected]: {
			type: 'boolean',
			name: 'Device Connected',
			description: 'Change style based on device connection state',
			defaultStyle: { bgcolor: Color.Green, color: Color.White },
			options: [],
			callback: () => self.api?.connected ?? false,
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
