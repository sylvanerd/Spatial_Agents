import {FixtureState} from "./ConductorTypes"

export const FIXTURE_STATE: FixtureState = {
  protocolVersion: "1.0",
  hud: {mode: "Offline mock", sessionCount: 3},
  sessions: [
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
  ],
}

export const CANNED_REPLY = "Got it — applying that in this session…"
