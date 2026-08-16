export type SessionStatus = "idle" | "working" | "blocked" | "done"

export type MessageRole = "user" | "assistant" | "tool" | "alert"

export interface TranscriptMessage {
  id: string
  role: MessageRole
  text: string
  tool?: string
  toolStatus?: string
}

export interface ConductorSession {
  id: string
  label: string
  repo: string
  task: string
  status: SessionStatus
  statusLabel: string
  activity: string
  lastOutput: string
  updatedAt: number
  composerHint: string
  commandChip: string
  messages: TranscriptMessage[]
}

export interface AgentProject {
  id: string
  label: string
  sessions: ConductorSession[]
}

export interface FixtureState {
  protocolVersion: string
  hud: {mode: string; sessionCount: number; projectLabel?: string}
  activeProjectId?: string
  projects?: AgentProject[]
  sessions: ConductorSession[]
}

export interface OutputChunk {
  sessionId: string
  streamId: string
  seq: number
  channel: string
  text: string
  isFinal: boolean
}
