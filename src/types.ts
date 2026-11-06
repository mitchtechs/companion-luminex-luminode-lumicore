// Shapes from the LumiNode/LumiCore WebApi v2.8.1 (only the fields this module reads)

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
	alternate: string | null
}

export interface Profile {
	id: number
	name: string
	exists: boolean
}

export interface ActiveProfile {
	name: string
	modified: boolean
}

export interface PlayerData {
	id: number
	playing_snapshot_id: string | null
	next_snapshot_id: string | null
}

export interface Io {
	id: number
	io_class: 'dmx' | 'artnet' | 'sacn' | 'rttrp' | 'kinet' | 'internal' | 'player'
	name: string
	port_number?: number
	universe?: number
	pb_number?: number
}

export interface SourceInfo {
	ip: string
	name?: string
	priority?: number | null
	group?: number | null
}

export interface ProcessBlock {
	id: number
	name: string
	colors: string[]
	mode: 'NONE' | 'REROUTE' | 'LTP' | 'HTP' | 'BACKUP' | 'XFADE' | 'SWITCH' | 'CUSTOM'
	/** Input slot ("0"-"3") → IO id */
	inputs?: Record<string, number>
	sources?: { inputs: Array<SourceInfo | SourceInfo[] | null> }
	/** Active input slot; only set in SWITCH and BACKUP modes, otherwise null */
	summarized_active_input?: number | null
}
