import { InstanceStatus, type CompanionVariableValues } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { LuminexWebSocket } from './websocket.js'
import { FeedbackId } from './feedbacks.js'
import type { DeviceInfo, ProcessBlock, Profile, WsMessage, ApiState } from './types.js'

export class LuminexAPI {
	private instance: ModuleInstance
	private host = ''
	private password = ''
	private ws?: LuminexWebSocket
	private pollTimer?: ReturnType<typeof setInterval>
	private longPollTimer?: ReturnType<typeof setInterval>

	connected = false
	useWebSockets = false

	mainPlayerIdx = -1
	currentSnapshot = '-'
	nextSnapshot = '-'
	activeProfile?: string
	profiles: Profile[] = []
	processblocks: ProcessBlock[] = []
	deviceInfo?: DeviceInfo
	firmwareVersion?: string

	constructor(instance: ModuleInstance) {
		this.instance = instance
	}

	setConfig(host: string, password: string): void {
		this.host = host
		this.password = password
	}

	async destroy(): Promise<void> {
		this.stopPolling()
		this.ws?.close()
		this.ws = undefined
		this.updateStatus(InstanceStatus.Disconnected)
	}

	// --- Connection ---

	async connect(): Promise<void> {
		this.stopPolling()

		try {
			const data = await this.fetchJSON<{ current: string; alternate: string }>('software/version')
			if (!data) return

			this.firmwareVersion = data.current
			this.instance.setVariableValues({
				current_version: data.current,
				alternate_version: data.alternate,
			})

			this.useWebSockets = this.supportsWebSocket(data.current)
			this.log('debug', `WebSocket support: ${this.useWebSockets}`)
			this.updateStatus(InstanceStatus.Ok)

			if (this.useWebSockets) {
				this.initWebSocket()
			}

			this.startPolling()
		} catch {
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}

	private supportsWebSocket(version: string): boolean {
		if (!version) return false
		const m = version.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
		if (!m) return true // assume custom firmware supports it
		const major = parseInt(m[1] ?? '0', 10)
		const minor = parseInt(m[2] ?? '0', 10)
		if (isNaN(major) || isNaN(minor)) return false
		return major > 2 || (major === 2 && minor >= 7)
	}

	// --- WebSocket ---

	private initWebSocket(): void {
		this.ws?.close()
		this.ws = new LuminexWebSocket(this.host, {
			onopen: () => {
				this.updateStatus(InstanceStatus.Ok)
				this.log('debug', `WebSocket connected to ${this.host}`)
			},
			onmessage: (data) => this.handleWsMessage(data as WsMessage),
			onerror: (msg) => this.log('error', `WebSocket error: ${msg}`),
			ondisconnect: (msg) => {
				this.log('debug', `WebSocket disconnected: ${msg}`)
				this.updateStatus(InstanceStatus.Disconnected, msg)
			},
		})
		this.ws.init()
	}

	private handleWsMessage(msg: WsMessage): void {
		if (!msg?.op || !msg?.path) return

		if (msg.path === '/api') {
			const state = msg.value as ApiState
			if (state.deviceinfo) this.processDeviceInfo(state.deviceinfo)
			if (state.active_profile_name) this.processActiveProfile(state.active_profile_name)
			if (state.profile) this.processProfiles(state.profile)
			if (state.processblock) this.processProcessBlocks(state.processblock)
			this.instance.initVariables()
		} else if (msg.path === '/api/deviceinfo') {
			this.processDeviceInfo(msg.value)
		} else if (msg.path === '/api/active_profile_name') {
			this.processActiveProfile(msg.value)
		} else if (msg.path.startsWith('/api/profile/') && msg.op === 'replace') {
			const id = parseInt(msg.path.replace('/api/profile/', ''), 10)
			this.updateSingleProfile(id, msg.value)
		} else if (/^\/api\/processblock\/\d+$/.test(msg.path) && msg.op === 'replace') {
			const id = parseInt(msg.path.replace('/api/processblock/', ''), 10)
			this.updateSingleProcessBlock(id, msg.value)
		}
	}

	// --- Polling ---

	private startPolling(): void {
		this.stopPolling()
		const interval = this.instance.config?.pollInterval ?? 5000

		if (!this.useWebSockets) {
			this.fetchDeviceInfo()
			this.fetchProfileNames()
			this.fetchProcessBlocks()
		}
		this.fetchPlayInfo()

		this.pollTimer = setInterval(() => {
			if (!this.useWebSockets) {
				this.fetchDeviceInfo()
			}
			this.fetchPlayInfo()
		}, interval)

		if (!this.useWebSockets) {
			this.longPollTimer = setInterval(() => {
				this.fetchProfileNames()
				this.fetchProcessBlocks()
			}, 15000)
		}
	}

	private stopPolling(): void {
		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}
		if (this.longPollTimer) {
			clearInterval(this.longPollTimer)
			this.longPollTimer = undefined
		}
	}

	// --- REST API ---

	private getHeaders(): Headers {
		const headers = new Headers()
		headers.set('Content-Type', 'application/json')
		if (this.password) {
			headers.set('Authorization', `Basic ${Buffer.from('admin:' + this.password).toString('base64')}`)
		}
		return headers
	}

	private async fetchJSON<T>(endpoint: string): Promise<T | null> {
		try {
			const res = await fetch(`http://${this.host}/api/${endpoint}`, {
				headers: this.getHeaders(),
			})
			if (!res.ok) {
				this.log('debug', `GET ${endpoint} returned ${res.status}`)
				return null
			}
			const contentType = res.headers.get('content-type')
			if (contentType?.includes('application/json')) {
				return (await res.json()) as T
			}
			return null
		} catch (err) {
			this.log('debug', `GET ${endpoint} failed: ${err}`)
			return null
		}
	}

	async sendCommand(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<void> {
		try {
			const res = await fetch(`http://${this.host}/api/${endpoint}`, {
				method,
				headers: this.getHeaders(),
				body: body !== undefined ? JSON.stringify(body) : undefined,
			})
			if (!res.ok) {
				this.log('warn', `${method} ${endpoint} returned ${res.status}`)
			}
		} catch (err) {
			this.log('warn', `${method} ${endpoint} failed: ${err}`)
		}
	}

	// --- Data Fetching ---

	private async fetchDeviceInfo(): Promise<void> {
		const data = await this.fetchJSON<DeviceInfo>('deviceinfo')
		if (data) this.processDeviceInfo(data)
	}

	private async fetchProfileNames(): Promise<void> {
		const [activeData, profileData] = await Promise.all([
			this.fetchJSON<{ name: string }>('active_profile_name'),
			this.fetchJSON<Profile[]>('profile'),
		])
		if (activeData) this.processActiveProfile(activeData)
		if (profileData) this.processProfiles(profileData)
	}

	private async fetchProcessBlocks(): Promise<void> {
		const data = await this.fetchJSON<ProcessBlock[]>('processblock')
		if (data) this.processProcessBlocks(data)
	}

	private async fetchPlayInfo(): Promise<void> {
		const players = await this.fetchJSON<Array<{ id: number }>>('IO?io_class=player')
		if (!players || players.length === 0) {
			this.mainPlayerIdx = -1
			this.currentSnapshot = '-'
			this.nextSnapshot = '-'
			this.instance.setVariableValues({
				current_snapshot: '-',
				next_snapshot: '-',
			})
			this.instance.checkFeedbacks(FeedbackId.PlayingCue, FeedbackId.NextCue)
			return
		}

		this.mainPlayerIdx = players[0].id

		const playerData = await this.fetchJSON<{ playing_snapshot_id: string; next_snapshot_id: string }>(
			`play/player/${this.mainPlayerIdx}`,
		)
		if (playerData) {
			this.currentSnapshot = playerData.playing_snapshot_id
			this.nextSnapshot = playerData.next_snapshot_id
			this.instance.setVariableValues({
				current_snapshot: playerData.playing_snapshot_id,
				next_snapshot: playerData.next_snapshot_id,
			})
			this.instance.checkFeedbacks(FeedbackId.PlayingCue, FeedbackId.NextCue)
		}
	}

	// --- Data Processing ---

	private processDeviceInfo(data: DeviceInfo): void {
		this.deviceInfo = data
		this.instance.setVariableValues({
			short_name: data.short_name,
			long_name: data.long_name,
			device_id: data.ID,
			color_1: data.colors?.[0] ?? '',
			color_2: data.colors?.[1] ?? '',
			nr_dmx_ports: data.nr_dmx_ports,
			nr_processblocks: data.nr_processblocks,
			serial: data.serial,
			mac_address: data.mac_address,
			device_type: data.type,
		})
	}

	private processActiveProfile(data: { name: string }): void {
		if (this.activeProfile !== data.name) {
			this.activeProfile = data.name
			this.instance.setVariableValues({ active_profile_name: data.name })
			this.instance.checkFeedbacks(FeedbackId.ActiveProfile)
		}
	}

	private processProfiles(data: Profile[]): void {
		if (!Array.isArray(data)) return
		const vars: CompanionVariableValues = {}
		for (const profile of data) {
			const displayId = profile.id + 1
			const old = this.profiles.find((p) => p.id === profile.id)
			if (!old || old.name !== profile.name) {
				vars[`profile_${displayId}_name`] = profile.name
			}
		}
		this.profiles = data
		this.instance.setVariableValues(vars)
		this.instance.checkFeedbacks(FeedbackId.ActiveProfile)
	}

	private processProcessBlocks(data: ProcessBlock[]): void {
		if (!Array.isArray(data)) return
		const vars: CompanionVariableValues = {}
		for (const pb of data) {
			const displayId = pb.id + 1
			const old = this.processblocks.find((p) => p.id === pb.id)
			if (!old || old.name !== pb.name) {
				vars[`processblock_${displayId}_name`] = pb.name
			}
			if (!old || JSON.stringify(old.colors) !== JSON.stringify(pb.colors)) {
				vars[`processblock_${displayId}_color_1`] = pb.colors?.[0] ?? ''
				vars[`processblock_${displayId}_color_2`] = pb.colors?.[1] ?? ''
			}
			if (!old || old.mode !== pb.mode) {
				vars[`processblock_${displayId}_mode`] = pb.mode
			}
		}
		this.processblocks = data
		this.instance.setVariableValues(vars)
		this.instance.checkFeedbacks(FeedbackId.ProcessBlockMode)
	}

	private updateSingleProfile(id: number, profile: { name: string }): void {
		const displayId = id + 1
		const old = this.profiles.find((p) => p.id === id)
		if (!old || old.name !== profile.name) {
			this.instance.setVariableValues({ [`profile_${displayId}_name`]: profile.name })
		}
		this.profiles[id] = { id, name: profile.name }
		this.instance.checkFeedbacks(FeedbackId.ActiveProfile)
	}

	private updateSingleProcessBlock(id: number, pb: ProcessBlock): void {
		const displayId = id + 1
		const vars: CompanionVariableValues = {}
		const old = this.processblocks.find((p) => p.id === id)
		if (!old || old.name !== pb.name) vars[`processblock_${displayId}_name`] = pb.name
		if (!old || JSON.stringify(old.colors) !== JSON.stringify(pb.colors)) {
			vars[`processblock_${displayId}_color_1`] = pb.colors?.[0] ?? ''
			vars[`processblock_${displayId}_color_2`] = pb.colors?.[1] ?? ''
		}
		if (!old || old.mode !== pb.mode) vars[`processblock_${displayId}_mode`] = pb.mode
		this.processblocks[id] = pb
		this.instance.setVariableValues(vars)
		this.instance.checkFeedbacks(FeedbackId.ProcessBlockMode)
	}

	// --- Helpers ---

	private updateStatus(status: InstanceStatus, msg?: string | null): void {
		this.connected = status === InstanceStatus.Ok
		this.instance.updateStatus(status, msg ?? undefined)
	}

	private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
		this.instance.log(level, message)
	}
}
