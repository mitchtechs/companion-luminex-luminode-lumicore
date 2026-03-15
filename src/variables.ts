import type { CompanionVariableDefinition } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const variables: CompanionVariableDefinition[] = [
		// Device Info
		{ variableId: 'short_name', name: 'Short Name' },
		{ variableId: 'long_name', name: 'Long Name' },
		{ variableId: 'device_id', name: 'Device ID' },
		{ variableId: 'color_1', name: 'Device Color 1' },
		{ variableId: 'color_2', name: 'Device Color 2' },
		{ variableId: 'nr_dmx_ports', name: 'Number of DMX Ports' },
		{ variableId: 'nr_processblocks', name: 'Number of Process Engines' },
		{ variableId: 'serial', name: 'Serial Number' },
		{ variableId: 'mac_address', name: 'MAC Address' },
		{ variableId: 'device_type', name: 'Device Type' },

		// Software
		{ variableId: 'current_version', name: 'Current Firmware Version' },
		{ variableId: 'alternate_version', name: 'Alternate Firmware Version' },

		// Playback
		{ variableId: 'current_snapshot', name: 'Currently Playing Snapshot' },
		{ variableId: 'next_snapshot', name: 'Next Staged Snapshot' },

		// Active Profile
		{ variableId: 'active_profile_name', name: 'Active Profile Name' },
	]

	// Profile names (40 slots)
	for (let i = 1; i <= 40; i++) {
		variables.push({
			variableId: `profile_${i}_name`,
			name: `Profile ${i} Name`,
		})
	}

	// Process block variables
	const numPB = self.api?.deviceInfo?.nr_processblocks ?? 8
	for (let i = 1; i <= numPB; i++) {
		variables.push(
			{ variableId: `processblock_${i}_name`, name: `Process Engine ${i} Name` },
			{ variableId: `processblock_${i}_color_1`, name: `Process Engine ${i} Color 1` },
			{ variableId: `processblock_${i}_color_2`, name: `Process Engine ${i} Color 2` },
			{ variableId: `processblock_${i}_mode`, name: `Process Engine ${i} Mode` },
			{ variableId: `processblock_${i}_active_input`, name: `Process Engine ${i} Active Input` },
			{ variableId: `processblock_${i}_sources`, name: `Process Engine ${i} Available Sources` },
		)
	}

	self.setVariableDefinitions(variables)
}
