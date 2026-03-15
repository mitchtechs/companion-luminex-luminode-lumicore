import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { type ModuleConfig, GetConfigFields } from './config.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { LuminexAPI } from './api.js'

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	config?: ModuleConfig
	api?: LuminexAPI

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config

		const host = this.getHostAddress()
		if (host) {
			this.api = new LuminexAPI(this)
			this.updateStatus(InstanceStatus.Connecting)
			this.api.setConfig(host, config.password ?? '')
			this.initAll()
			await this.api.connect()
		} else {
			await this.api?.destroy()
			this.api = undefined
			this.initAll()
		}
	}

	async destroy(): Promise<void> {
		await this.api?.destroy()
		this.api = undefined
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		await this.api?.destroy()
		this.api = undefined
		await this.init(config)
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	initAll(): void {
		this.initVariables()
		this.initFeedbacks()
		this.initActions()
		this.initPresets()
	}

	initVariables(): void {
		UpdateVariableDefinitions(this)
	}

	initFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	initActions(): void {
		UpdateActions(this)
	}

	initPresets(): void {
		UpdatePresets(this)
	}

	private getHostAddress(): string | null {
		if (!this.config) return null
		if (this.config.bonjour_host) {
			const ip = this.config.bonjour_host.split(':')[0]
			const regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/
			if (regex.test(ip)) return ip
			this.log('warn', `IP ${ip} has unexpected format`)
			return null
		}
		return this.config.host || null
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
