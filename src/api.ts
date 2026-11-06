import { InstanceStatus, type CompanionVariableValues } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { FeedbackId } from './feedbacks.js'
import type {
	ActiveProfile,
	DeviceInfo,
	Io,
	PlayerData,
	ProcessBlock,
	Profile,
	SourceInfo,
	VersionInfo,
} from './types.js'

/**
 * Read-only status client for the LumiNode/LumiCore WebApi (v2.8.1, GET requests only).
 * One request at a time with a timeout; when the device stops answering the gap between
 * tries grows to 30 s, and it recovers on its own when the device comes back.
 */
const REQUEST_TIMEOUT_MS = 3000
const SLOW_REFRESH_MS = 30000
const MAX_BACKOFF_MS = 30000

export class LuminexAPI {
	private instance: ModuleInstance
	private host = ''
	private password = ''
	private timer?: ReturnType<typeof setTimeout>
	private abort?: AbortController
	private stopped = true
	private failures = 0
	private slowDueAt = 0
	private lastValues: CompanionVariableValues = {}

	connected = false
	deviceInfo?: DeviceInfo
	activeProfile?: string
	currentSnapshot = '-'
	nextSnapshot = '-'
	processblocks: ProcessBlock[] = []
	/** Active input slot (0-3) per process engine, only for SWITCH/BACKUP modes */
	activeSlots: Map<number, number | null> = new Map()
	private ios: Map<number, Io> = new Map()
	private playerId: number | null = null

	constructor(instance: ModuleInstance) {
		this.instance = instance
	}

	setConfig(host: string, password: string): void {
		this.host = host
		this.password = password
	}

	start(): void {
		this.stopped = false
		this.failures = 0
		this.slowDueAt = 0
		void this.tick()
	}

	async destroy(): Promise<void> {
		this.stopped = true
		if (this.timer) clearTimeout(this.timer)
		this.timer = undefined
		this.abort?.abort()
		this.setConnected(false)
	}

	private get interval(): number {
		return Math.max(1000, Number(this.instance.config?.pollInterval) || 2000)
	}

	private schedule(ms: number): void {
		if (this.stopped) return
		this.timer = setTimeout(() => void this.tick(), ms)
	}

	private async tick(): Promise<void> {
		this.timer = undefined
		if (this.stopped) return
		try {
			if (!this.deviceInfo) await this.loadDevice()
			if (Date.now() >= this.slowDueAt) {
				await this.loadSlow()
				this.slowDueAt = Date.now() + SLOW_REFRESH_MS
			}
			await this.loadProcessBlocks()
			await this.loadPlayer()
			this.failures = 0
			this.setConnected(true)
			this.schedule(this.interval)
		} catch (err) {
			if (this.stopped) return
			this.failures++
			const status = err instanceof AuthError ? InstanceStatus.BadConfig : InstanceStatus.ConnectionFailure
			this.setConnected(false, status, err instanceof Error ? err.message : String(err))
			this.schedule(Math.min(this.interval * 2 ** this.failures, MAX_BACKOFF_MS))
		}
	}

	// --- REST (GET only) ---

	private async get<T>(path: string): Promise<T> {
		this.abort = new AbortController()
		const headers: Record<string, string> = { Accept: 'application/json' }
		if (this.password) headers.Authorization = `Basic ${Buffer.from('admin:' + this.password).toString('base64')}`
		const res = await fetch(`http://${this.host}/api/${path}`, {
			headers,
			signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
		})
		if (res.status === 401) throw new AuthError('Wrong password (401)')
		if (!res.ok) throw new Error(`GET /api/${path} returned ${res.status}`)
		return (await res.json()) as T
	}

	// --- Loaders ---

	/** Once per connection: firmware and device identity */
	private async loadDevice(): Promise<void> {
		const version = await this.get<VersionInfo>('software/version')
		const info = await this.get<DeviceInfo>('deviceinfo')
		this.deviceInfo = info
		this.setValues({
			current_version: version.current,
			alternate_version: version.alternate ?? '',
			short_name: info.short_name,
			long_name: info.long_name,
			device_id: info.ID,
			color_1: info.colors?.[0] ?? '',
			color_2: info.colors?.[1] ?? '',
			nr_dmx_ports: info.nr_dmx_ports,
			nr_processblocks: info.nr_processblocks,
			serial: info.serial,
			mac_address: info.mac_address,
			device_type: info.type,
		})
		this.instance.initVariables()
		this.instance.initPresets()
	}

	/** Every 30 s: IO names, profiles and the playback player (these rarely change) */
	private async loadSlow(): Promise<void> {
		const ios = await this.get<Io[]>('IO')
		this.ios = new Map(ios.filter((io) => typeof io.id === 'number' && io.id >= 0).map((io) => [io.id, io]))
		const player = ios.find((io) => io.io_class === 'player')
		this.playerId = player ? player.id : null

		const profiles = await this.get<Profile[]>('profile')
		const values: CompanionVariableValues = {}
		for (const p of profiles) {
			if (p.id >= 0 && p.id < 40) values[`profile_${p.id + 1}_name`] = p.exists ? p.name : ''
		}
		const active = await this.get<ActiveProfile>('active_profile_name')
		this.activeProfile = active.name
		values.active_profile_name = active.name
		values.active_profile_modified = active.modified ? 'yes' : 'no'
		this.setValues(values)
		this.instance.checkFeedbacks(FeedbackId.ActiveProfile)
	}

	/** Every poll: one request returns every process engine with its mode and active input */
	private async loadProcessBlocks(): Promise<void> {
		const blocks = await this.get<ProcessBlock[]>('processblock')
		const countChanged = blocks.length !== this.processblocks.length
		this.processblocks = blocks

		const values: CompanionVariableValues = {}
		blocks.forEach((pb, i) => {
			const n = i + 1
			const slot =
				typeof pb.summarized_active_input === 'number' && pb.summarized_active_input < 4
					? pb.summarized_active_input
					: null
			this.activeSlots.set(i, slot)
			values[`processblock_${n}_name`] = pb.name
			values[`processblock_${n}_mode`] = pb.mode
			values[`processblock_${n}_color_1`] = pb.colors?.[0] ?? ''
			values[`processblock_${n}_color_2`] = pb.colors?.[1] ?? ''
			values[`processblock_${n}_inputs`] = [0, 1, 2, 3]
				.filter((s) => pb.inputs?.[String(s)] !== undefined)
				.map((s) => `${s + 1}: ${this.inputName(pb, s)}`)
				.join(', ')
			values[`processblock_${n}_active_slot`] = slot === null ? '' : slot + 1
			values[`processblock_${n}_active_input`] = slot === null ? this.mergeLabel(pb.mode) : this.inputName(pb, slot)
			values[`processblock_${n}_active_source`] = slot === null ? '' : this.sourceLabel(pb.sources?.inputs?.[slot])
		})

		if (countChanged) {
			this.instance.initVariables()
			this.instance.initPresets()
		}
		if (this.setValues(values)) {
			this.instance.checkFeedbacks(FeedbackId.ActiveInput, FeedbackId.ProcessBlockMode)
		}
	}

	private async loadPlayer(): Promise<void> {
		let playing = '-'
		let next = '-'
		if (this.playerId !== null) {
			const data = await this.get<PlayerData>(`play/player/${this.playerId}`)
			playing = data.playing_snapshot_id ?? '-'
			next = data.next_snapshot_id ?? '-'
		}
		this.currentSnapshot = playing
		this.nextSnapshot = next
		if (this.setValues({ current_snapshot: playing, next_snapshot: next })) {
			this.instance.checkFeedbacks(FeedbackId.PlayingCue, FeedbackId.NextCue)
		}
	}

	// --- Helpers ---

	/** Name of the IO patched to an input slot: its own name, else a description, else "Input n" */
	private inputName(pb: ProcessBlock, slot: number): string {
		const ioId = pb.inputs?.[String(slot)]
		const io = ioId === undefined ? undefined : this.ios.get(ioId)
		if (!io) return `Input ${slot + 1}`
		if (io.name) return io.name
		switch (io.io_class) {
			case 'dmx':
				return `DMX ${io.port_number ?? ''}`.trim()
			case 'artnet':
				return `Art-Net ${io.universe ?? ''}`.trim()
			case 'sacn':
				return `sACN ${io.universe ?? ''}`.trim()
			case 'kinet':
				return `KiNET ${io.universe ?? ''}`.trim()
			case 'rttrp':
				return `RTTrP ${io.universe ?? ''}`.trim()
			case 'internal':
				return `PE ${(io.pb_number ?? 0) + 1}`
			default:
				return `Input ${slot + 1}`
		}
	}

	/** Who is sending to the active input (console name and/or IP), when the device reports it */
	private sourceLabel(src: SourceInfo | SourceInfo[] | null | undefined): string {
		if (!src) return ''
		const list = Array.isArray(src) ? src : [src]
		return list.map((s) => (s.name ? `${s.name} (${s.ip})` : s.ip)).join(', ')
	}

	private mergeLabel(mode: string): string {
		switch (mode) {
			case 'HTP':
			case 'LTP':
				return `Merge (${mode})`
			case 'XFADE':
				return 'Crossfade'
			case 'CUSTOM':
				return 'Custom merge'
			case 'REROUTE':
				return 'Reroute'
			default:
				return '-'
		}
	}

	/** Sets only the variables that changed; returns true if anything did */
	private setValues(values: CompanionVariableValues): boolean {
		const changed: CompanionVariableValues = {}
		for (const [k, v] of Object.entries(values)) {
			if (this.lastValues[k] !== v) changed[k] = v
		}
		if (Object.keys(changed).length === 0) return false
		Object.assign(this.lastValues, changed)
		this.instance.setVariableValues(changed)
		return true
	}

	private setConnected(connected: boolean, status?: InstanceStatus, message?: string): void {
		const was = this.connected
		this.connected = connected
		this.instance.updateStatus(connected ? InstanceStatus.Ok : (status ?? InstanceStatus.Disconnected), message)
		if (!connected) {
			this.deviceInfo = undefined
			this.slowDueAt = 0
		}
		if (was !== connected) this.instance.checkFeedbacks(FeedbackId.DeviceConnected)
	}
}

class AuthError extends Error {}
