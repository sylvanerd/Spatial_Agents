"use strict";

const fs = require("fs");
const path = require("path");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class FixtureAdapter {
  constructor(mockPath) {
    this.mockPath = mockPath || path.join(__dirname, "..", "mock_state.json");
    this.listeners = { status: [], log: [] };
    this.state = clone(JSON.parse(fs.readFileSync(this.mockPath, "utf8")));
  }

  listSessions() {
    return clone(this.state.sessions);
  }

  sendCommand(sessionId, text, onChunk) {
    const session = this.state.sessions.find((item) => item.id === sessionId);
    if (!session) {
      return { ok: false, error: "unknown session " + sessionId };
    }

    const commandId = "cmd-" + Date.now();
    session.messages.push({
      id: commandId + "-user",
      role: "user",
      text: text,
    });
    session.status = "working";
    session.statusLabel = "WORKING";
    session.activity = "Applying your instruction…";
    session.updatedAt = Date.now();

    const reply = "Got it — applying that in this session…";
    const streamId = "stream-" + commandId;
    let seq = 0;

    const parts = [reply.slice(0, 12), reply.slice(12)];
    parts.forEach((part, index) => {
      setTimeout(() => {
        const isFinal = index === parts.length - 1;
        if (isFinal) {
          session.messages.push({
            id: commandId + "-assistant",
            role: "assistant",
            text: reply,
          });
          session.lastOutput = reply;
          session.activity = "Applying your instruction…";
        }
        if (onChunk) {
          onChunk({
            sessionId: sessionId,
            streamId: streamId,
            seq: seq++,
            channel: "assistant",
            text: part,
            isFinal: isFinal,
          });
        }
        this.listeners.log.forEach((fn) => fn(sessionId, part));
        if (isFinal) {
          this.listeners.status.forEach((fn) => fn(session));
        }
      }, 180 * (index + 1));
    });

    return { ok: true, commandId: commandId, session: clone(session) };
  }

  onStatus(fn) {
    this.listeners.status.push(fn);
  }

  onLog(fn) {
    this.listeners.log.push(fn);
  }
}

module.exports = { FixtureAdapter };
