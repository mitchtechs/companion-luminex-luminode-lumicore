import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import * as Color from './colors.js'

export enum FeedbackId {
	PlayingCue = 'playing_cue',
	NextCue = 'next_cue',
	ActiveProfile = 'active_profile',
	ProcessBlockMode = 'processblock_mode',
	DeviceConnected = 'device_connected',
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const api = self.api

	const feedbacks: CompanionFeedbackDefinitions = {
		[FeedbackId.PlayingCue]: {
			type: 'boolean',
			name: 'Cue Is Playing',
			description: 'Change style when a specific snapshot is currently playing',
			defaultStyle: {
				bgcolor: Color.Red,
				color: Color.White,
			},
			options: [
				{
					type: 'textinput',
					id: 'snapshot_id',
					label: 'Snapshot ID',
					default: '1.00',
				},
			],
			callback: (feedback) => {
				return api?.currentSnapshot === feedback.options.snapshot_id
			},
		},

		[FeedbackId.NextCue]: {
			type: 'boolean',
			name: 'Cue Is Staged Next',
			description: 'Change style when a specific snapshot is staged as the next cue',
			defaultStyle: {
				bgcolor: Color.Orange,
				color: Color.White,
			},
			options: [
				{
					type: 'textinput',
					id: 'snapshot_id',
					label: 'Snapshot ID',
					default: '1.00',
				},
			],
			callback: (feedback) => {
				return api?.nextSnapshot === feedback.options.snapshot_id
			},
		},

		[FeedbackId.ActiveProfile]: {
			type: 'boolean',
			name: 'Active Profile',
			description: 'Change style when a specific profile is active',
			defaultStyle: {
				bgcolor: Color.Green,
				color: Color.White,
			},
			options: [
				{
					type: 'textinput',
					id: 'profile_name',
					label: 'Profile Name',
					default: '',
					useVariables: true,
				},
			],
			callback: (feedback) => {
				return api?.activeProfile === feedback.options.profile_name
			},
		},

		[FeedbackId.ProcessBlockMode]: {
			type: 'boolean',
			name: 'Process Engine Mode',
			description: 'Change style when a process engine is set to a specific mode',
			defaultStyle: {
				bgcolor: Color.Blue,
				color: Color.White,
			},
			options: [
				{
					type: 'number',
					id: 'processblock',
					label: 'Process Engine',
					tooltip: 'Process engine number (1-based)',
					default: 1,
					min: 1,
					max: 16,
				},
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'HTP',
					choices: [
						{ id: 'HTP', label: 'HTP' },
						{ id: 'LTP', label: 'LTP' },
						{ id: 'Crossfade', label: 'Crossfade' },
						{ id: 'Backup', label: 'Backup' },
						{ id: 'Switch', label: 'Switch' },
						{ id: 'Custom', label: 'Custom' },
					],
				},
			],
			callback: (feedback) => {
				const pbIdx = Number(feedback.options.processblock) - 1
				const pb = api?.processblocks.find((p) => p.id === pbIdx)
				return pb?.mode === feedback.options.mode
			},
		},

		[FeedbackId.DeviceConnected]: {
			type: 'boolean',
			name: 'Device Connected',
			description: 'Change style based on device connection state',
			defaultStyle: {
				bgcolor: Color.Green,
				color: Color.White,
			},
			options: [],
			callback: () => {
				return api?.connected ?? false
			},
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
