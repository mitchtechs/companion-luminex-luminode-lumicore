export interface DeviceInfo {
	short_name: string
	long_name: string
	ID: number
	colors: string[]
	nr_dmx_ports: number
	nr_processblocks: number
	serial: string
	mac_address: string
	type: string
}

export interface VersionInfo {
	current: string
	alternate: string
}

export interface Profile {
	id: number
	name: string
}

export interface ProcessBlock {
	id: number
	name: string
	colors: string[]
	mode: string
}

export interface PlayerInfo {
	playing_snapshot_id: string
	next_snapshot_id: string
}

export interface IODevice {
	id: number
	io_class: string
	name: string
}

export interface WsMessage {
	op: string
	path: string
	value: any
}

export interface ApiState {
	deviceinfo?: DeviceInfo
	active_profile_name?: { name: string }
	profile?: Profile[]
	processblock?: ProcessBlock[]
}
