import {isPreviewEditor} from "./PreviewInput"
import {SIK} from "SpectaclesInteractionKit.lspkg/SIK"

export type GazeCallbacks = {
  onSelect: (sessionId: string) => void
  onDeselect: (sessionId: string) => void
  isTalkLocked: (sessionId: string) => boolean
}

interface Target {
  sessionId: string
  object: SceneObject
}

const DWELL_SEC = 0.45
const HYSTERESIS_SEC = 0.55
const ALIGN_DOT = 0.985

export class GazeAddressing {
  private targets: Target[] = []
  private callbacks: GazeCallbacks
  private cameraObject: SceneObject
  private selectedId: string | null = null
  private pendingId: string | null = null
  private pendingSince: number = 0
  private leaveSince: number = -1
  private hoverId: string | null = null
  private hoverCounts: Map<string, number> = new Map()
  private softHoverId: string | null = null
  private softUntil: number = 0
  private stickyUntil: number = 0
  private heldId: string | null = null

  constructor(cameraObject: SceneObject, callbacks: GazeCallbacks) {
    this.cameraObject = cameraObject
    this.callbacks = callbacks
  }

  public clear(): void {
    this.targets = []
    this.selectedId = null
    this.pendingId = null
    this.hoverId = null
    this.hoverCounts.clear()
    this.softHoverId = null
    this.softUntil = 0
    this.leaveSince = -1
    this.stickyUntil = 0
    this.heldId = null
  }

  public register(sessionId: string, object: SceneObject): void {
    this.targets.push({sessionId: sessionId, object: object})
  }

  public unregister(sessionId: string): void {
    this.targets = this.targets.filter((target) => target.sessionId !== sessionId)
    this.hoverCounts.delete(sessionId)
    if (this.hoverId === sessionId) {
      this.hoverId = null
    }
    if (this.softHoverId === sessionId) {
      this.softHoverId = null
    }
    if (this.heldId === sessionId) {
      this.heldId = null
    }
    if (this.pendingId === sessionId) {
      this.pendingId = null
    }
    if (this.selectedId === sessionId) {
      this.selectedId = null
      this.leaveSince = -1
    }
  }

  public selected(): string | null {
    return this.selectedId
  }

  public noteHover(sessionId: string): void {
    const next = (this.hoverCounts.get(sessionId) || 0) + 1
    this.hoverCounts.set(sessionId, next)
    this.hoverId = sessionId
    this.softHoverId = sessionId
    this.leaveSince = -1
    this.applySelect(sessionId)
  }

  public noteHoverEnd(sessionId: string): void {
    const next = Math.max(0, (this.hoverCounts.get(sessionId) || 0) - 1)
    this.hoverCounts.set(sessionId, next)
    if (next > 0) {
      return
    }
    if (this.hoverId === sessionId) {
      this.hoverId = null
    }
    if (this.softHoverId === sessionId && getTime() >= this.softUntil) {
      this.softHoverId = null
    }
    if (this.heldId === sessionId || this.callbacks.isTalkLocked(sessionId)) {
      return
    }
    if (this.pickByPointer() === sessionId) {
      this.hoverId = sessionId
      this.leaveSince = -1
    }
  }

  public stay(sessionId: string, holdSec: number = 0.8): void {
    this.softHoverId = sessionId
    this.softUntil = getTime() + holdSec
    this.leaveSince = -1
    this.applySelect(sessionId)
  }

  public hold(sessionId: string): void {
    this.heldId = sessionId
    this.leaveSince = -1
    this.applySelect(sessionId)
  }

  public releaseHold(sessionId: string): void {
    if (this.heldId === sessionId) {
      this.heldId = null
    }
    if (!this.hoverId && this.selectedId === sessionId && !this.callbacks.isTalkLocked(sessionId)) {
      this.leaveSince = getTime()
    }
  }

  public selectNow(sessionId: string): void {
    this.stickyUntil = getTime() + 0.45
    this.applySelect(sessionId)
  }

  public update(): void {
    const now = getTime()
    if (this.softHoverId && now >= this.softUntil) {
      this.softHoverId = null
    }
    const pointerId = this.pickByPointer()
    const rayId = isPreviewEditor() ? null : this.pickByHeadRay()
    const candidate = this.hoverId || pointerId || this.softHoverId || rayId

    if (candidate) {
      this.leaveSince = -1
      if (this.selectedId !== candidate) {
        if (this.pendingId !== candidate) {
          this.pendingId = candidate
          this.pendingSince = now
        } else if (now - this.pendingSince >= DWELL_SEC) {
          this.applySelect(candidate)
        }
      }
    } else if (this.selectedId) {
      if (
        this.heldId === this.selectedId ||
        this.callbacks.isTalkLocked(this.selectedId) ||
        now < this.stickyUntil
      ) {
        return
      }
      if (this.leaveSince < 0) {
        this.leaveSince = now
      } else if (now - this.leaveSince >= HYSTERESIS_SEC) {
        const prev = this.selectedId
        this.selectedId = null
        this.pendingId = null
        this.leaveSince = -1
        this.callbacks.onDeselect(prev)
      }
    }
  }

  private applySelect(sessionId: string): void {
    if (this.selectedId === sessionId) {
      return
    }
    const prev = this.selectedId
    this.selectedId = sessionId
    this.pendingId = null
    this.leaveSince = -1
    if (prev) {
      this.callbacks.onDeselect(prev)
    }
    this.callbacks.onSelect(sessionId)
  }

  private pickByPointer(): string | null {
    try {
      const interactors = SIK.InteractionManager.getTargetingInteractors()
      if (!interactors) {
        return null
      }
      for (let i = 0; i < interactors.length; i++) {
        const it = interactors[i] as {
          isActive?: () => boolean
          currentInteractable?: {sceneObject?: SceneObject}
          startPoint?: vec3
          endPoint?: vec3
        }
        if (it.isActive && !it.isActive()) {
          continue
        }
        const hit = it.currentInteractable
        const so = hit && hit.sceneObject
        if (so) {
          const fromHit = this.sessionIdForObject(so)
          if (fromHit) {
            return fromHit
          }
        }
        const fromRay = this.sessionIdForRay(it.startPoint, it.endPoint)
        if (fromRay) {
          return fromRay
        }
      }
    } catch (err) {
      return null
    }
    return null
  }

  private sessionIdForObject(so: SceneObject): string | null {
    let cur: SceneObject | null = so
    while (cur) {
      for (let i = 0; i < this.targets.length; i++) {
        if (this.targets[i].object === cur) {
          return this.targets[i].sessionId
        }
      }
      cur = cur.getParent()
    }
    return null
  }

  private sessionIdForRay(start: vec3 | undefined, end: vec3 | undefined): string | null {
    if (!start || !end) {
      return null
    }
    const dir = end.sub(start)
    if (dir.length < 0.01) {
      return null
    }
    let bestId: string | null = null
    let bestDist = 1e9
    this.targets.forEach((target) => {
      const origin = target.object.getTransform().getWorldPosition()
      const center = origin.add(new vec3(0, -12, 0))
      const to = center.sub(start)
      const t = to.dot(dir) / dir.dot(dir)
      if (t < 0 || t > 1.15) {
        return
      }
      const closest = start.add(dir.uniformScale(t))
      const d = closest.sub(center)
      if (Math.abs(d.x) < 9.5 && d.y < 8 && d.y > -18 && Math.abs(d.z) < 10) {
        const dist = d.length
        if (dist < bestDist) {
          bestDist = dist
          bestId = target.sessionId
        }
      }
    })
    return bestId
  }

  private pickByHeadRay(): string | null {
    const camTr = this.cameraObject.getTransform()
    const origin = camTr.getWorldPosition()
    const forward = camTr.forward
    let bestId: string | null = null
    let bestDot = ALIGN_DOT
    this.targets.forEach((target) => {
      const pos = target.object.getTransform().getWorldPosition()
      const dir = pos.sub(origin)
      if (dir.length < 0.01) {
        return
      }
      const align = dir.normalize().dot(forward)
      if (align > bestDot) {
        bestDot = align
        bestId = target.sessionId
      }
    })
    return bestId
  }
}
