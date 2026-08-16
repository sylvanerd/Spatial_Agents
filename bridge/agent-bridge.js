"use strict";

const { FixtureAdapter } = require("./adapters/fixture");

class AgentBridge {
  constructor(adapter) {
    this.adapter = adapter || new FixtureAdapter();
    this.sessions = new Map();
    this.adapter.listSessions().forEach((session) => {
      this.sessions.set(session.id, session);
    });
  }

  snapshot() {
    return {
      type: "session_snapshot",
      sessions: Array.from(this.sessions.values()),
    };
  }

  applyCommand(message, broadcast) {
    const result = this.adapter.sendCommand(
      message.sessionId,
      message.text,
      (chunk) => {
        broadcast({ type: "output_chunk", ...chunk });
        if (chunk.isFinal) {
          const latest = this.adapter
            .listSessions()
            .find((item) => item.id === message.sessionId);
          if (latest) {
            this.sessions.set(latest.id, latest);
            broadcast({ type: "session_upsert", session: latest });
          }
        }
      }
    );

    if (!result.ok) {
      return { type: "error", commandId: message.commandId, message: result.error };
    }

    if (result.session) {
      this.sessions.set(result.session.id, result.session);
      broadcast({ type: "session_upsert", session: result.session });
    }

    return { type: "command_ack", commandId: message.commandId, sessionId: message.sessionId };
  }
}

module.exports = { AgentBridge };
