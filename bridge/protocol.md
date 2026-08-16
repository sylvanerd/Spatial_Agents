# Spatial Coding Conductor — frozen JSON contract v1.0

Text WebSocket frames. One JSON object per frame.

## Handshake

```json
{ "type": "hello", "protocolVersion": "1.0", "role": "specs" | "bridge" | "verify" }
{ "type": "hello_ack", "protocolVersion": "1.0", "role": "bridge" }
```

## Bridge → clients

- `session_snapshot` — `{ sessions: Session[] }` full list on connect
- `session_upsert` — `{ session: Session }`
- `session_remove` — `{ sessionId }`
- `session_status` — `{ sessionId, status, activity?, statusLabel? }`
- `output_chunk` — `{ sessionId, streamId, seq, channel, text, isFinal }`
- `output_snapshot` — `{ sessionId, messages: Message[] }`
- `command_ack` — `{ commandId, sessionId }`
- `error` — `{ message, commandId? }`

`status`: `idle` | `working` | `blocked` | `done`  
`channel`: `assistant` | `tool` | `warning` | `error`

## Specs → bridge

- `command` — `{ commandId, sessionId, text, addressedAt }`

## Session

`id`, `label`, `repo`, `task`, `status`, `statusLabel`, `activity`, `lastOutput`, `updatedAt`, `composerHint`, `commandChip`, `messages`
