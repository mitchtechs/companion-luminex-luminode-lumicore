import WebSocket from 'ws'

export interface WsCallbacks {
	onopen: () => void
	onmessage: (data: unknown) => void
	onerror: (msg: string) => void
	ondisconnect: (msg: string) => void
}

export class LuminexWebSocket {
	private ws?: WebSocket
	private reconnectTimer?: ReturnType<typeof setTimeout>
	private pingTimer?: ReturnType<typeof setInterval>
	private pongTimeout?: ReturnType<typeof setTimeout>
	private callbacks: WsCallbacks
	private host: string
	private closed = false

	constructor(host: string, callbacks: WsCallbacks) {
		this.host = host
		this.callbacks = callbacks
	}

	init(): void {
		if (this.closed) return

		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}

		if (this.ws) {
			try {
				this.ws.close(1000)
			} catch {
				// ignore
			}
			this.ws = undefined
		}

		const url = `ws://${this.host}/api/ws`
		this.ws = new WebSocket(url, ['luminex-luminode-v1-json'])

		this.ws.on('open', () => this.handleOpen())
		this.ws.on('close', (code: number) => this.handleClose(code))
		this.ws.on('message', (data: WebSocket.RawData) => this.handleMessage(data))
		this.ws.on('error', (err: Error) => this.handleError(err))
	}

	close(): void {
		this.closed = true
		this.clearTimers()
		if (this.ws) {
			try {
				this.ws.close(1000)
			} catch {
				// ignore
			}
			this.ws = undefined
		}
	}

	send(data: string): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(data)
		}
	}

	private handleOpen(): void {
		this.startPingPong()
		this.callbacks.onopen()
	}

	private handleClose(code: number): void {
		this.callbacks.ondisconnect(`Connection closed with code ${code}`)
		this.scheduleReconnect()
	}

	private handleError(err: Error): void {
		this.callbacks.onerror(err.message)
	}

	private handleMessage(raw: WebSocket.RawData): void {
		const str = raw.toString()

		if (str === 'pong') {
			if (this.pongTimeout) {
				clearTimeout(this.pongTimeout)
				this.pongTimeout = undefined
			}
			return
		}

		try {
			const parsed = JSON.parse(str)
			this.callbacks.onmessage(parsed)
		} catch {
			this.callbacks.onmessage(str)
		}
	}

	private startPingPong(): void {
		if (this.pingTimer) clearInterval(this.pingTimer)
		if (this.pongTimeout) {
			clearTimeout(this.pongTimeout)
			this.pongTimeout = undefined
		}

		this.pingTimer = setInterval(() => {
			if (this.pongTimeout) clearTimeout(this.pongTimeout)
			this.pongTimeout = setTimeout(() => {
				this.callbacks.ondisconnect('Pong timeout')
				this.scheduleReconnect()
			}, 3500)
			this.send('ping')
		}, 5000)
	}

	private scheduleReconnect(): void {
		if (this.closed) return
		this.clearTimers()
		if (this.ws) {
			try {
				this.ws.close(1000)
			} catch {
				// ignore
			}
		}
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = undefined
			this.init()
		}, 5000)
	}

	private clearTimers(): void {
		if (this.pingTimer) {
			clearInterval(this.pingTimer)
			this.pingTimer = undefined
		}
		if (this.pongTimeout) {
			clearTimeout(this.pongTimeout)
			this.pongTimeout = undefined
		}
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}
	}
}
