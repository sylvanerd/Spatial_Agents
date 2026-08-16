import {ConductorSession, OutputChunk} from "./ConductorTypes"

export type ConnectionHandler = {
  onSnapshot: (sessions: ConductorSession[]) => void
  onUpsert: (session: ConductorSession) => void
  onRemove: (sessionId: string) => void
  onChunk: (chunk: OutputChunk) => void
  onAck: (commandId: string, sessionId: string) => void
  onOpen: () => void
  onClose: () => void
  onError: (message: string) => void
}

export class ConductorConnection {
  public wsUrl: string = "ws://127.0.0.1:8080"
  private socket: WebSocket | null = null
  private handlers: ConnectionHandler
  private internetModule: InternetModule

  constructor(handlers: ConnectionHandler) {
    this.handlers = handlers
    this.internetModule = require("LensStudio:InternetModule") as InternetModule
  }

  public isOpen(): boolean {
    return this.socket !== null && this.socket.readyState === 1
  }

  public connect(): void {
    if (this.isOpen()) {
      return
    }
    try {
      this.socket = this.internetModule.createWebSocket(this.wsUrl)
      this.socket.binaryType = "blob"
      this.socket.onopen = () => {
        this.send({type: "hello", protocolVersion: "1.0", role: "specs"})
        this.handlers.onOpen()
      }
      this.socket.onmessage = (event: WebSocketMessageEvent) => {
        if (event.data instanceof Blob) {
          return
        }
        this.onText(String(event.data))
      }
      this.socket.onclose = () => {
        this.handlers.onClose()
      }
      this.socket.onerror = () => {
        this.handlers.onError("WebSocket error")
      }
    } catch (err) {
      this.handlers.onError(String(err))
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  public sendCommand(commandId: string, sessionId: string, text: string): void {
    this.send({
      type: "command",
      commandId: commandId,
      sessionId: sessionId,
      text: text,
      addressedAt: Date.now(),
    })
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== 1) {
      return
    }
    this.socket.send(JSON.stringify(payload))
  }

  private onText(text: string): void {
    let msg: Record<string, unknown>
    try {
      msg = JSON.parse(text) as Record<string, unknown>
    } catch (err) {
      this.handlers.onError("invalid json")
      return
    }
    const type = String(msg.type || "")
    if (type === "session_snapshot") {
      this.handlers.onSnapshot((msg.sessions as ConductorSession[]) || [])
    } else if (type === "session_upsert") {
      this.handlers.onUpsert(msg.session as ConductorSession)
    } else if (type === "session_remove") {
      this.handlers.onRemove(String(msg.sessionId))
    } else if (type === "output_chunk") {
      this.handlers.onChunk(msg as unknown as OutputChunk)
    } else if (type === "command_ack") {
      this.handlers.onAck(String(msg.commandId), String(msg.sessionId))
    } else if (type === "error") {
      this.handlers.onError(String(msg.message || "bridge error"))
    }
  }
}
