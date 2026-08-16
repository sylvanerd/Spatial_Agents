import {AgentProject, ConductorSession, FixtureState} from "./ConductorTypes"

const PROJECT_A_SESSIONS: ConductorSession[] = [
  {
    id: "auth-refactor",
    label: "auth-refactor",
    repo: "Spatial_Agents",
    task: "Cookie auth migration",
    status: "working",
    statusLabel: "WORKING",
    activity: "Editing src/auth.ts",
    lastOutput: "Cookie options are next — SameSite=Lax, Secure in production.",
    updatedAt: 0,
    composerHint: "Look here, then speak or type a command…",
    commandChip: "Also rotate refresh tokens.",
    messages: [
      {
        id: "ar-1",
        role: "user",
        text: "Move session tokens into httpOnly cookies and drop localStorage.",
      },
      {
        id: "ar-2",
        role: "assistant",
        text: "I'll switch the auth flow to cookies and update the login + refresh paths.",
      },
      {
        id: "ar-3",
        role: "tool",
        text: "Edit src/auth.ts",
        tool: "Edit",
        toolStatus: "running",
      },
      {
        id: "ar-4",
        role: "assistant",
        text: "Cookie options are next — SameSite=Lax, Secure in production.",
      },
    ],
  },
  {
    id: "perf-pass",
    label: "perf-pass",
    repo: "Spatial_Agents",
    task: "Preview hitch",
    status: "blocked",
    statusLabel: "Waiting for human's input",
    activity: "Waiting for human's input",
    lastOutput: "I am paused here. Waiting for human's input before I change the capture timeout.",
    updatedAt: 0,
    composerHint: "Tell this agent what to do next…",
    commandChip: "Drop the capture timeout to 500ms.",
    messages: [
      {
        id: "pp-1",
        role: "user",
        text: "The preview hitch is in the capture path. Find it.",
      },
      {
        id: "pp-2",
        role: "assistant",
        text: "CaptureRuntimeView is waiting on a 2s timeout. I can drop it to 500ms.",
      },
      {
        id: "pp-3",
        role: "tool",
        text: "Read preview-inspection/SKILL.md",
        tool: "Read",
        toolStatus: "done",
      },
      {
        id: "pp-4",
        role: "assistant",
        text: "I am paused here. Waiting for human's input before I change the capture timeout.",
      },
    ],
  },
  {
    id: "docs-cleanup",
    label: "docs-cleanup",
    repo: "Spatial_Agents",
    task: "README setup",
    status: "done",
    statusLabel: "DONE",
    activity: "Updated README install steps",
    lastOutput: "Done. README now has clone, npm i, and the Preview override notes.",
    updatedAt: 0,
    composerHint: "Ask a follow-up…",
    commandChip: "Add a troubleshooting note.",
    messages: [
      {
        id: "dc-1",
        role: "user",
        text: "Rewrite the setup section so a new clone just works.",
      },
      {
        id: "dc-2",
        role: "assistant",
        text: "Done. README now has clone, npm i, and the Preview override notes.",
      },
      {
        id: "dc-3",
        role: "tool",
        text: "Edit README.md",
        tool: "Edit",
        toolStatus: "done",
      },
    ],
  },
]

const PROJECT_B_SESSIONS: ConductorSession[] = [
  {
    id: "ui-polish",
    label: "ui-polish",
    repo: "Spatial_Agents",
    task: "Button hit targets",
    status: "idle",
    statusLabel: "IDLE",
    activity: "Ready for a prompt",
    lastOutput: "",
    updatedAt: 0,
    composerHint: "Look here, then speak or type a command…",
    commandChip: "Widen the Look button.",
    messages: [
      {
        id: "ub-1",
        role: "user",
        text: "The Look button is hard to hit in Preview.",
      },
      {
        id: "ub-2",
        role: "assistant",
        text: "I can enlarge the hit target and keep the label the same size.",
      },
    ],
  },
  {
    id: "bridge-ws",
    label: "bridge-ws",
    repo: "Spatial_Agents",
    task: "Reconnect backoff",
    status: "working",
    statusLabel: "WORKING",
    activity: "Editing bridge/ws-server.js",
    lastOutput: "Adding jitter so reconnects do not stampede.",
    updatedAt: 0,
    composerHint: "Tell this agent what to do next…",
    commandChip: "Cap retries at 8.",
    messages: [
      {
        id: "bw-1",
        role: "user",
        text: "Live drops and reconnects too fast. Add backoff.",
      },
      {
        id: "bw-2",
        role: "assistant",
        text: "Adding jitter so reconnects do not stampede.",
      },
      {
        id: "bw-3",
        role: "tool",
        text: "Edit bridge/ws-server.js",
        tool: "Edit",
        toolStatus: "running",
      },
    ],
  },
]

const PROJECT_C_SESSIONS: ConductorSession[] = [
  {
    id: "shader-pass",
    label: "shader-pass",
    repo: "Spatial_Agents",
    task: "Glow orb falloff",
    status: "working",
    statusLabel: "WORKING",
    activity: "Editing GlowOrb.graphShader",
    lastOutput: "Softening the outer halo so it does not bloom the card.",
    updatedAt: 0,
    composerHint: "Ask a follow-up…",
    commandChip: "Keep the core brighter.",
    messages: [
      {
        id: "sp-1",
        role: "user",
        text: "The status orb halo is too hot against the card.",
      },
      {
        id: "sp-2",
        role: "assistant",
        text: "Softening the outer halo so it does not bloom the card.",
      },
    ],
  },
]

const STUFF_SESSIONS: ConductorSession[] = [
  {
    id: "scratch",
    label: "scratch",
    repo: "notes",
    task: "Unsorted notes",
    status: "idle",
    statusLabel: "IDLE",
    activity: "Catch-all for stray prompts",
    lastOutput: "",
    updatedAt: 0,
    composerHint: "Park a thought here…",
    commandChip: "File this under Project A.",
    messages: [
      {
        id: "st-1",
        role: "user",
        text: "Hold this until I know which project it belongs to.",
      },
    ],
  },
]

export const FIXTURE_PROJECTS: AgentProject[] = [
  {id: "project-a", label: "Project A", sessions: PROJECT_A_SESSIONS},
  {id: "project-b", label: "Project B", sessions: PROJECT_B_SESSIONS},
  {id: "project-c", label: "Project C", sessions: PROJECT_C_SESSIONS},
  {id: "stuff", label: "Stuff", sessions: STUFF_SESSIONS},
]

export const FIXTURE_STATE: FixtureState = {
  protocolVersion: "1.0",
  hud: {mode: "Offline mock", sessionCount: 3, projectLabel: "Project A"},
  activeProjectId: "project-a",
  projects: FIXTURE_PROJECTS,
  sessions: PROJECT_A_SESSIONS,
}

export const CANNED_REPLY = "Got it — applying that in this session…"
