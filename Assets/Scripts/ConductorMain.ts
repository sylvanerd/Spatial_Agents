import {FIXTURE_STATE} from "./FixtureData"
import {SessionStore} from "./SessionStore"
import {ConductorConnection} from "./ConductorConnection"
import {GazeAddressing} from "./GazeAddressing"
import {VoiceCommandGate} from "./VoiceCommandGate"
import {SessionSpawnLayout} from "./SessionSpawnLayout"
import {ConductorAudio} from "./ConductorAudio"
import {SessionBlockUI} from "./SessionBlockUI"
import {ConductorHudUI} from "./ConductorHudUI"

@component
export class ConductorMain extends BaseScriptComponent {
  @input
  @hint("ws://127.0.0.1:8080 — used only when Live is toggled")
  wsUrl: string = "ws://127.0.0.1:8080"

  @input
  @allowUndefined
  avatarMeshes: RenderMesh[] = []

  @input
  @allowUndefined
  avatarMaterial: Material

  @input
  @allowUndefined
  glowMaterial: Material

  @input
  @allowUndefined
  orbMesh: RenderMesh

  @input
  @allowUndefined
  cameraObject: SceneObject

  private store: SessionStore = new SessionStore()
  private connection: ConductorConnection | null = null
  private gaze: GazeAddressing | null = null
  private voice: VoiceCommandGate | null = null
  private audio: ConductorAudio = new ConductorAudio()
  private blocks: Map<string, SessionBlockUI> = new Map()
  private hud: ConductorHudUI | null = null
  private liveRequested: boolean = false

  onAwake(): void {
    this.store.hydrate(FIXTURE_STATE.sessions)
    this.voice = new VoiceCommandGate({
      onListening: (sessionId, partial) => {
        const block = this.blocks.get(sessionId)
        if (block) {
          block.setExpanded(true)
          block.setListening(true, partial)
        }
      },
      onDraft: (sessionId, text) => {
        const block = this.blocks.get(sessionId)
        if (block) {
          block.setDraft(text)
        }
      },
      onCancel: (sessionId) => {
        const block = this.blocks.get(sessionId)
        if (block) {
          block.setListening(false, "")
          block.clearComposer()
        }
      },
      onError: (sessionId, message) => {
        print("[Conductor] voice error " + message)
        const block = this.blocks.get(sessionId)
        if (block) {
          block.setListening(false, "")
        }
      },
    })

    this.connection = new ConductorConnection({
      onSnapshot: (sessions) => {
        this.store.replaceAll(sessions)
        this.store.setLive(true)
        this.rebuildBlocks()
        this.refreshHud()
      },
      onUpsert: (session) => {
        this.store.upsert(session)
        const block = this.blocks.get(session.id)
        if (block) {
          block.applySession(session)
        }
      },
      onRemove: (sessionId) => {
        this.store.remove(sessionId)
      },
      onChunk: (chunk) => {
        this.store.applyChunk(chunk)
        const session = this.store.get(chunk.sessionId)
        const block = this.blocks.get(chunk.sessionId)
        if (session && block) {
          block.applySession(session)
        }
      },
      onAck: () => {},
      onOpen: () => {
        this.store.setLive(true)
        this.refreshHud()
      },
      onClose: () => {
        this.store.setLive(false)
        if (!this.liveRequested) {
          this.store.hydrate(FIXTURE_STATE.sessions)
          this.rebuildBlocks()
        }
        this.refreshHud()
      },
      onError: (message) => {
        print("[Conductor] ws " + message)
        this.store.setLive(false)
        this.refreshHud()
      },
    })
    this.connection.wsUrl = this.wsUrl

    this.store.onSession((session) => {
      const block = this.blocks.get(session.id)
      if (block) {
        block.applySession(session)
      }
    })

    this.createEvent("OnStartEvent").bind(() => this.startConductor())
  }

  private startConductor(): void {
    const camera = this.cameraObject || this.findCamera()
    this.gaze = new GazeAddressing(camera, {
      onSelect: (sessionId) => {
        this.blocks.forEach((block, id) => {
          block.setExpanded(id === sessionId)
        })
        this.audio.playSelectTick()
      },
      onDeselect: (sessionId) => {
        if (this.voice && this.voice.isLocked(sessionId)) {
          return
        }
        const block = this.blocks.get(sessionId)
        if (block) {
          block.setExpanded(false)
        }
      },
      isTalkLocked: (sessionId) => {
        return this.voice ? this.voice.isLocked(sessionId) : false
      },
    })

    this.spawnHud()
    this.rebuildBlocks()
    this.createEvent("UpdateEvent").bind(() => {
      if (this.gaze) {
        this.gaze.update()
      }
    })
  }

  private spawnHud(): void {
    const hudObj = global.scene.createSceneObject("ConductorHUD")
    hudObj.setParent(this.sceneObject)
    hudObj.getTransform().setLocalPosition(new vec3(0, 14, -84))
    this.hud = hudObj.createComponent(ConductorHudUI.getTypeName()) as ConductorHudUI
    this.hud.bindToggle(() => this.toggleLive())
    this.hud.bindAdd(() => this.addSession())
    this.refreshHud()
  }

  private rebuildBlocks(): void {
    this.blocks.forEach((block) => {
      block.getSceneObject().destroy()
    })
    this.blocks.clear()
    if (this.gaze) {
      this.gaze.clear()
    }

    const layout = new SessionSpawnLayout()
    const sessions = this.store.list()
    sessions.forEach((session, index) => {
      const so = global.scene.createSceneObject("Session-" + session.id)
      so.setParent(this.sceneObject)
      so.getTransform().setLocalPosition(layout.positionForIndex(index, sessions.length))
      so.getTransform().setLocalRotation(layout.rotationForIndex(index))
      const block = so.createComponent(SessionBlockUI.getTypeName()) as SessionBlockUI
      block.setup(session, this.blockHandlers(), this.orbMesh || this.pickOrbMesh(), this.glowMaterial || this.avatarMaterial)
      this.blocks.set(session.id, block)
      if (this.gaze) {
        this.gaze.register(session.id, so)
      }
    })
    this.refreshHud()
  }

  private blockHandlers() {
    return {
      onHoverStart: (sessionId: string) => {
        if (this.gaze) {
          this.gaze.noteHover(sessionId)
        }
      },
      onHoverEnd: (sessionId: string) => {
        if (this.gaze) {
          this.gaze.noteHoverEnd(sessionId)
        }
      },
      onHoverStay: (sessionId: string) => {
        if (this.gaze) {
          this.gaze.stay(sessionId)
        }
      },
      onSelect: (sessionId: string) => {
        if (this.gaze) {
          this.gaze.selectNow(sessionId)
        }
      },
      onGrabStart: (sessionId: string) => {
        if (this.gaze) {
          this.gaze.hold(sessionId)
        }
      },
      onGrabEnd: (sessionId: string) => {
        if (this.gaze) {
          this.gaze.releaseHold(sessionId)
        }
      },
      onMic: (sessionId: string) => {
        if (this.gaze) {
          this.gaze.selectNow(sessionId)
        }
        if (this.voice) {
          this.voice.lockAndListen(sessionId)
        }
      },
      onSend: (sessionId: string, text: string) => {
        this.submitCommand(sessionId, text)
      },
      onCancel: (sessionId: string) => {
        if (this.voice) {
          this.voice.cancel()
        }
        const block = this.blocks.get(sessionId)
        if (block) {
          block.clearComposer()
        }
      },
      onClose: (sessionId: string) => {
        this.killSession(sessionId)
      },
    }
  }

  private killSession(sessionId: string): void {
    if (this.voice && this.voice.isLocked(sessionId)) {
      this.voice.cancel()
    }
    if (this.gaze) {
      this.gaze.unregister(sessionId)
    }
    const block = this.blocks.get(sessionId)
    this.blocks.delete(sessionId)
    this.store.remove(sessionId)
    if (block) {
      block.getSceneObject().destroy()
    }
    this.refreshHud()
  }

  private submitCommand(sessionId: string, text: string): void {
    const trimmed = text && text.length > 0 ? text : "Follow up on this session."
    this.store.appendUser(sessionId, trimmed)
    const session = this.store.get(sessionId)
    const block = this.blocks.get(sessionId)
    if (session && block) {
      block.setExpanded(true)
      block.applySession(session)
      block.clearComposer()
    }
    if (this.voice) {
      this.voice.clear()
    }

    if (this.connection && this.connection.isOpen()) {
      this.connection.sendCommand("cmd-" + Date.now(), sessionId, trimmed)
    } else {
      this.store.streamCannedReply(sessionId, this)
    }
  }

  private addSession(): void {
    const session = this.store.createNew()
    this.rebuildBlocks()
    if (this.gaze) {
      this.gaze.selectNow(session.id)
    }
  }

  private toggleLive(): void {
    this.liveRequested = !this.liveRequested
    if (this.liveRequested && this.connection) {
      this.connection.connect()
    } else if (this.connection) {
      this.connection.disconnect()
      this.store.setLive(false)
      this.store.hydrate(FIXTURE_STATE.sessions)
      this.rebuildBlocks()
    }
    this.refreshHud()
  }

  private refreshHud(): void {
    if (this.hud) {
      this.hud.setMode(this.store.isLive(), this.store.list().length)
    }
  }

  private pickOrbMesh(): RenderMesh | null {
    if (this.orbMesh) {
      return this.orbMesh
    }
    if (this.avatarMeshes && this.avatarMeshes.length > 0) {
      return this.avatarMeshes[0]
    }
    return null
  }

  private findCamera(): SceneObject {
    const count = global.scene.getRootObjectsCount()
    for (let i = 0; i < count; i++) {
      const root = global.scene.getRootObject(i)
      const found = this.searchCamera(root)
      if (found) {
        return found
      }
    }
    print("[Conductor] camera fallback to conductor root")
    return this.sceneObject
  }

  private searchCamera(from: SceneObject): SceneObject | null {
    if (from.getComponent("Component.Camera")) {
      return from
    }
    const n = from.getChildrenCount()
    for (let i = 0; i < n; i++) {
      const found = this.searchCamera(from.getChild(i))
      if (found) {
        return found
      }
    }
    return null
  }
}
