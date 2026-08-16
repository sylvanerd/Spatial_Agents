# Spatial Agents

## TL;DR

Developers and creators keep many coding-agent sessions open across several projects, and on a laptop those sessions collapse into an indistinguishable pile of terminals and tabs. Spatial Agents gives each session a body: a card you place anywhere in the room, plus a project basket below that holds Project A, B, C, and Stuff — pinch a file and that project’s agents swap into the space around you. You address an agent by **looking** at it and work with it by **speaking**, so gaze answers *which agent* and voice answers *what to do*, and the place you left a card becomes how you remember what it was working on. The cards mirror real sessions on your laptop over a small local bridge, so the laptop stays the source of truth while the room becomes where you organize it.

---

**Product name:** Spatial Agents  
**What it is:** A spatial way of interacting with coding agents  
**Platform:** Specs (Spectacles) — Lens Studio 5.23, Device Type Override SPECS 27  
**Repo:** https://github.com/sylvanerd/Spatial_Agents  
**Status:** Preview demo — fixture-first, optional laptop bridge. Two memory layers: **projects in a basket**, **agents in space**.

---

## Problem

Developers and creators already keep **many agent sessions open for each project**, and they usually have **several projects open at once**. On a laptop that becomes a pile of terminals and tabs. It is hard to remember which session is waiting, which project it belongs to, and what you last asked it to do.

There is no place-based memory. You cannot put “the auth work” on the left and “the docs pass” on the right and trust that your body will find them again.

## Product thesis

If each coding-agent session is **embodied and spatialized**, a person can use their own **memory space** — a memory-palace habit of binding a location to a thing — to keep agents organized.

- **Where** a project file sits in the basket is which project you are in.
- **Where** an agent card sits is the session you assigned it.
- **Looking at a card** is how you address that agent.
- **Speaking or sending a command** is how you work with it.

Interaction becomes more natural and more intuitive than hopping between session lists. Work stays more organized, and talking to spatial agents is more efficient because you are not searching a stack of windows for the right thread.

The laptop remains the source of truth. Gaze answers *which agent*. Voice or a command chip answers *what to do*.

---

## Who it is for

Developers and creators who run multiple coding-agent sessions across one or more projects, and who want those sessions in the room with them — in Lens Studio Preview today, on Specs next.

Not in this version: other people in the same room, a store listing, or a published `wss://` service.

---

## Intended loop

1. Open the Lens. The **open project** (Project A by default) shows its agent cards in space. A **project basket** sits below with Project A, Project B, Project C, and Stuff.
2. Hover or approach a file in the basket → it lifts toward the hand. Pinch it → that project opens. The cards swap to that project’s sessions. The HUD shows the project name.
3. Not looking at a card → collapsed **indicator**: orb, name, status, activity, Look.
4. Gaze or hover the card → it expands **down from the same top handle**. Indicator hides. Conversation + composer show.
5. Look away (cursor leaves the card in Preview) → it auto-collapses, unless you are talking or grabbing the orb.
6. Talk (Mic / ASR) or tap a suggested command → Send. The thread keeps previous messages and appends yours, then a reply.
7. Grab the **orb** to move one session. Grab the short bar above the HUD to move the handle, the menu, the cards, and the basket together.
8. HUD **+** adds a new idle session in the open project. Card **×** removes that session.

Gaze never opens the microphone. Opening a project is not talking to an agent. Mic / double-pinch (device) is the talk gate.

---

## What you see in Preview today

**Group bar** (above the HUD): a short unlabeled handle. Grab it to move the handle, HUD, agent cards, and project basket together.

**HUD:** `Project A` · `Offline mock` · `N sessions` · **+** · `Live`

**Project basket** (below the cards, packed in a row): four files. Hover lifts a file; pinch opens that project and swaps the cards. HUD updates to the project name.

| Open project | Sessions |
|---|---|
| **Project A** (default) | `auth-refactor` WORKING · `perf-pass` waiting · `docs-cleanup` DONE |
| **Project B** | `ui-polish` idle · `bridge-ws` WORKING |
| **Project C** | `shader-pass` WORKING |
| **Stuff** | `scratch` idle (catch-all) |

**Project A cards**

| Session | Status | Orb | What it is doing |
|---|---|---|---|
| `auth-refactor` | WORKING | Yellow | Cookie auth migration — editing `src/auth.ts` |
| `perf-pass` | Waiting for human's input | Red | Preview hitch — paused before changing capture timeout |
| `docs-cleanup` | DONE | Green | README install steps updated |

**Collapsed card:** orb, title, status, one activity line, Look.

**Expanded card:** title · repo, stacked conversation (You / agent / tool), then a locked **Your voice or text** field, Mic / Send / Cancel, and a suggested-command chip.

**Orb colors:** gaze/talk orange (pulse while talking), working yellow, waiting/blocked red, done green.

**Preview stand-ins**

| On Specs | In Preview |
|---|---|
| Head-gaze dwell | Cursor on the card |
| Look away | Cursor leaves the card |
| Double-pinch to talk | Mic |
| Speak | Laptop ASR, or the command chip |
| Pinch-drag one session | Grab that card’s orb |
| Pinch-drag the whole stack | Grab the short bar above the HUD |
| Hover a project file | Cursor on the file (it lifts) |
| Pinch to open a project | Click / pinch the lifted file |

The AR keyboard does not appear under SPECS 27. Chips + ASR are the Preview input path.

---

## Architecture

```
Laptop (optional)          Specs Lens
┌─────────────────┐        ┌──────────────────────┐
│ Claude / fixture│        │ Gaze + ASR + cards   │
│ agent-bridge    │  JSON  │ Projects + sessions  │
│ ws:// :8080     │◄──────►│ Live connection      │
└─────────────────┘   WS   └──────────────────────┘
```

The Lens only speaks a frozen JSON contract (`hello`, `session_snapshot`, `output_chunk`, `command`, …). `session_snapshot` may include optional `projects` + `activeProjectId`; `sessions` is the open project. Preview boots from bundled `mock_state.json` and never waits on the socket. HUD **Live** swaps to the bridge when Experimental APIs and `ws://` are available.

v1 adapter is fixture (and a Claude Code stub). Cursor can plug in later without changing the Lens.

---

## What this demo does not claim

- Real desk / world meshing
- Walking around with true head-gaze
- Device double-pinch / fist-pause / wave-summon in the Editor
- Directional spatial audio from a card (Preview is stereo)
- Live text-to-3D avatars (placeholders only)
- Live Claude attach (stub; fixture replies after Send)
- Multiplayer or store publish

---

## Success for this Preview

A wearer (or a reviewer in Lens Studio) can:

- Keep several sessions in view at once and tell working / waiting / done apart
- Switch projects from the basket and see the HUD + cards become that project
- Bind a session to a place by moving its orb, then find it again by that place
- Grab the short bar above the HUD and move the menu, cards, and basket together
- Expand one card by looking at it and keep it open while the cursor stays on it
- Send a line and still read the previous conversation
- Keep spoken input inside the input field

---

## Next (not this commit)

- Live Claude Code adapter behind the same contract
- Device gaze + double-pinch ASR on hardware
- Spatial chimes from the card’s position
- Generated meshes in the avatar slot
- Drag a project file out of the basket and park it elsewhere
- `wss://` + auth if this ever leaves the LAN
