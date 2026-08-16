"use strict";

/**
 * Stub only — live Claude Code attach is out of this Preview demo.
 * Same surface as FixtureAdapter so a later adapter can drop in.
 */
class ClaudeCodeAdapter {
  listSessions() {
    return [];
  }

  sendCommand() {
    return { ok: false, error: "ClaudeCodeAdapter is a stub in v1 Preview demo" };
  }

  onStatus() {}

  onLog() {}
}

module.exports = { ClaudeCodeAdapter };
