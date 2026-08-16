import {ConductorSession, OutputChunk, TranscriptMessage} from "./ConductorTypes"
import {CANNED_REPLY} from "./FixtureData"

export type StoreListener = (sessions: ConductorSession[]) => void
export type SessionListener = (session: ConductorSession) => void

export class SessionStore {
  private sessions: Map<string, ConductorSession> = new Map()
  private listeners: StoreListener[] = []
  private sessionListeners: SessionListener[] = []
  private live: boolean = false

  public hydrate(list: ConductorSession[]): void {
    this.sessions.clear()
    list.forEach((session) => {
      this.sessions.set(session.id, this.cloneSession(session))
    })
    this.emit()
  }

  public replaceAll(list: ConductorSession[]): void {
    this.hydrate(list)
  }

  public createNew(): ConductorSession {
    const n = this.sessions.size + 1
    const session: ConductorSession = {
      id: "session-" + Date.now(),
      label: "session-" + n,
      repo: "Spatial_Agents",
      task: "New work",
      status: "idle",
      statusLabel: "IDLE",
      activity: "Ready for a prompt",
      lastOutput: "",
      updatedAt: Date.now(),
      composerHint: "Look here, then speak or type a command…",
      commandChip: "Start this session.",
      messages: [],
    }
    this.upsert(session)
    return this.cloneSession(session)
  }

  public upsert(session: ConductorSession): void {
    this.sessions.set(session.id, this.cloneSession(session))
    this.emit()
    this.emitSession(session.id)
  }

  public remove(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.emit()
  }

  public get(sessionId: string): ConductorSession | null {
    const found = this.sessions.get(sessionId)
    return found ? this.cloneSession(found) : null
  }

  public list(): ConductorSession[] {
    const out: ConductorSession[] = []
    this.sessions.forEach((session) => {
      out.push(this.cloneSession(session))
    })
    return out
  }

  public setLive(live: boolean): void {
    this.live = live
    this.emit()
  }

  public isLive(): boolean {
    return this.live
  }

  public onChange(fn: StoreListener): void {
    this.listeners.push(fn)
  }

  public onSession(fn: SessionListener): void {
    this.sessionListeners.push(fn)
  }

  public appendUser(sessionId: string, text: string): TranscriptMessage | null {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return null
    }
    const message: TranscriptMessage = {
      id: "user-" + Date.now(),
      role: "user",
      text: text,
    }
    session.messages.push(message)
    session.updatedAt = Date.now()
    this.emitSession(sessionId)
    this.emit()
    return message
  }

  public applyChunk(chunk: OutputChunk): void {
    const session = this.sessions.get(chunk.sessionId)
    if (!session) {
      return
    }
    if (chunk.isFinal) {
      session.lastOutput = chunk.text
      session.activity = "Applying your instruction…"
    }
    const role = chunk.channel === "tool" ? "tool" : "assistant"
    const msgId = chunk.streamId
    let found: TranscriptMessage | null = null
    session.messages.forEach((message) => {
      if (message.id === msgId) {
        found = message
      }
    })
    if (found) {
      found.text = chunk.text
      found.role = role
    } else {
      session.messages.push({
        id: msgId,
        role: role,
        text: chunk.text,
      })
    }
    session.updatedAt = Date.now()
    this.emitSession(chunk.sessionId)
    this.emit()
  }

  public streamCannedReply(sessionId: string, host: ScriptComponent): void {
    const first: OutputChunk = {
      sessionId: sessionId,
      streamId: "canned-" + Date.now(),
      seq: 0,
      channel: "assistant",
      text: CANNED_REPLY.substring(0, 12),
      isFinal: false,
    }
    this.applyChunk(first)

    const later = host.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
    later.bind(() => {
      this.applyChunk({
        sessionId: sessionId,
        streamId: first.streamId,
        seq: 1,
        channel: "assistant",
        text: CANNED_REPLY,
        isFinal: true,
      })
    })
    later.reset(0.35)
  }

  private emit(): void {
    const list = this.list()
    this.listeners.forEach((fn) => fn(list))
  }

  private emitSession(sessionId: string): void {
    const session = this.get(sessionId)
    if (!session) {
      return
    }
    this.sessionListeners.forEach((fn) => fn(session))
  }

  private cloneSession(session: ConductorSession): ConductorSession {
    return {
      id: session.id,
      label: session.label,
      repo: session.repo,
      task: session.task,
      status: session.status,
      statusLabel: session.statusLabel,
      activity: session.activity,
      lastOutput: session.lastOutput,
      updatedAt: session.updatedAt,
      composerHint: session.composerHint,
      commandChip: session.commandChip,
      messages: session.messages.map((message) => {
        return {
          id: message.id,
          role: message.role,
          text: message.text,
          tool: message.tool,
          toolStatus: message.toolStatus,
        }
      }),
    }
  }
}
