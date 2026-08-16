import {AgentProject, ConductorSession, FixtureState, OutputChunk, TranscriptMessage} from "./ConductorTypes"
import {CANNED_REPLY} from "./FixtureData"

export type StoreListener = (sessions: ConductorSession[]) => void
export type SessionListener = (session: ConductorSession) => void

export class SessionStore {
  private sessions: Map<string, ConductorSession> = new Map()
  private projects: Map<string, AgentProject> = new Map()
  private activeId: string = "project-a"
  private listeners: StoreListener[] = []
  private sessionListeners: SessionListener[] = []
  private live: boolean = false

  public hydrateFixture(state: FixtureState): void {
    this.projects.clear()
    const projects = state.projects && state.projects.length > 0 ? state.projects : null
    if (projects) {
      projects.forEach((project) => {
        this.projects.set(project.id, this.cloneProject(project))
      })
      this.activeId = state.activeProjectId || projects[0].id
      const active = this.projects.get(this.activeId)
      this.hydrate(active ? active.sessions : state.sessions)
      return
    }
    this.hydrate(state.sessions)
  }

  public hydrate(list: ConductorSession[]): void {
    this.sessions.clear()
    list.forEach((session) => {
      this.sessions.set(session.id, this.cloneSession(session))
    })
    this.syncActiveProject()
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

  public openProject(projectId: string): boolean {
    if (projectId === this.activeId) {
      return false
    }
    const next = this.projects.get(projectId)
    if (!next) {
      return false
    }
    this.syncActiveProject()
    this.activeId = projectId
    this.hydrate(next.sessions)
    return true
  }

  public listProjects(): AgentProject[] {
    const out: AgentProject[] = []
    this.projects.forEach((project) => {
      out.push(this.cloneProject(project))
    })
    return out
  }

  public activeProjectId(): string {
    return this.activeId
  }

  public activeProjectLabel(): string {
    const project = this.projects.get(this.activeId)
    return project ? project.label : "Project A"
  }

  public upsert(session: ConductorSession): void {
    this.sessions.set(session.id, this.cloneSession(session))
    this.syncActiveProject()
    this.emit()
    this.emitSession(session.id)
  }

  public remove(sessionId: string): void {
    this.sessions.delete(sessionId)
    this.syncActiveProject()
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
    this.syncActiveProject()
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

  private syncActiveProject(): void {
    const project = this.projects.get(this.activeId)
    if (project) {
      project.sessions = this.list()
    }
  }

  private cloneProject(project: AgentProject): AgentProject {
    return {
      id: project.id,
      label: project.label,
      sessions: project.sessions.map((session) => this.cloneSession(session)),
    }
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
