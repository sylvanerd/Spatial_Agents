import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexAlignSelf, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import {ConductorSession} from "./ConductorTypes"
import {applyTextRole, statusColor} from "./ConductorTheme"
import {SessionTranscriptController, TRANSCRIPT_VIEW_H} from "./SessionTranscriptController"
import {SessionComposerUI} from "./SessionComposerUI"
import {OrbMood, SessionStatusOrb} from "./SessionStatusOrb"

const PLATE_W = 16.2
const COLLAPSED_H = 10.8
const PAD = 1.15
const LINE_H = 2.15
const TITLE_H = 2.5
const OPEN_TITLE_H = 2.0
const COMPOSER_H = 11.2
const HIT_H = 2.4
const EXPAND_SEC = 0.32

export type BlockHandlers = {
  onHoverStart: (sessionId: string) => void
  onHoverEnd: (sessionId: string) => void
  onHoverStay: (sessionId: string) => void
  onSelect: (sessionId: string) => void
  onGrabStart: (sessionId: string) => void
  onGrabEnd: (sessionId: string) => void
  onMic: (sessionId: string) => void
  onSend: (sessionId: string, text: string) => void
  onCancel: (sessionId: string) => void
  onClose: (sessionId: string) => void
}

@component
export class SessionBlockUI extends BaseScriptComponent {
  private session: ConductorSession | null = null
  private handlers: BlockHandlers | null = null
  private plateHost: SceneObject | null = null
  private backPlate: BackPlate | null = null
  private contentFlex: FlexLayout | null = null
  private headerFlex: FlexLayout | null = null
  private indicatorRoot: SceneObject | null = null
  private indicatorItem: FlexItem | null = null
  private titleText: Text | null = null
  private statusText: Text | null = null
  private activityText: Text | null = null
  private activityItem: FlexItem | null = null
  private activityObject: SceneObject | null = null
  private hitButton: Button | null = null
  private hitLabel: Text | null = null
  private expandedTitle: Text | null = null
  private expandedRoot: SceneObject | null = null
  private expandedItem: FlexItem | null = null
  private expandedFlex: FlexLayout | null = null
  private transcript: SessionTranscriptController | null = null
  private composer: SessionComposerUI | null = null
  private orb: SessionStatusOrb | null = null
  private expanded: boolean = false
  private listening: boolean = false
  private grabbing: boolean = false
  private expandT: number = 0
  private built: boolean = false
  private ignoreHoverEndUntil: number = 0
  private orbMesh: RenderMesh | null = null
  private glowMat: Material | null = null

  public setup(
    session: ConductorSession,
    handlers: BlockHandlers,
    orbMesh: RenderMesh | null,
    glowMat: Material | null
  ): void {
    this.session = session
    this.handlers = handlers
    this.orbMesh = orbMesh
    this.glowMat = glowMat
    if (!this.built) {
      this.build()
    }
    this.applyChrome(true)
    this.refresh()
    this.refreshOrb()
  }

  public setExpanded(expanded: boolean): void {
    if (expanded && !this.expanded) {
      this.ignoreHoverEndUntil = getTime() + EXPAND_SEC + 0.25
      if (this.session && this.handlers) {
        this.handlers.onHoverStay(this.session.id)
      }
    }
    this.expanded = expanded
    this.refreshHeader()
    this.refreshOrb()
  }

  public setListening(listening: boolean, partial: string): void {
    this.listening = listening
    if (this.composer) {
      this.composer.setListening(listening, partial)
    }
    this.refreshOrb()
  }

  public setDraft(text: string): void {
    if (this.composer) {
      this.composer.setDraft(text)
    }
  }

  public applySession(session: ConductorSession): void {
    this.session = session
    this.refresh()
    this.refreshOrb()
  }

  public clearComposer(): void {
    if (this.composer) {
      this.composer.clearDraft()
    }
  }

  private build(): void {
    this.built = true
    this.plateHost = global.scene.createSceneObject("PlateHost")
    this.plateHost.setParent(this.sceneObject)
    this.plateHost.getTransform().setLocalPosition(new vec3(0, -COLLAPSED_H / 2, 0))

    this.plateHost.createComponent("Component.Canvas")
    this.backPlate = this.plateHost.createComponent(BackPlate.getTypeName()) as BackPlate
    this.backPlate.size = new vec2(PLATE_W, COLLAPSED_H)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.plateHost)
    content.getTransform().setLocalPosition(new vec3(0, 0, 0.6))

    const flex = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    this.contentFlex = flex
    flex.width = PLATE_W - PAD * 2
    flex.height = COLLAPSED_H
    flex.direction = FlexDirection.Column
    flex.alignItems = FlexAlign.Stretch
    flex.justifyContent = FlexJustify.Start
    flex.rowGap = 0.2
    flex.paddingTop = PAD
    flex.paddingBottom = PAD
    flex.paddingLeft = PAD
    flex.paddingRight = PAD

    this.indicatorRoot = global.scene.createSceneObject("IndicatorMenu")
    this.indicatorRoot.setParent(content)
    const indicatorFlex = this.indicatorRoot.createComponent(FlexLayout.getTypeName()) as FlexLayout
    indicatorFlex.width = PLATE_W - PAD * 2
    indicatorFlex.height = -1
    indicatorFlex.direction = FlexDirection.Column
    indicatorFlex.alignItems = FlexAlign.Stretch
    indicatorFlex.rowGap = 0.55
    this.indicatorItem = this.indicatorRoot.createComponent(FlexItem.getTypeName()) as FlexItem
    this.indicatorItem.alignSelf = FlexAlignSelf.Stretch
    this.indicatorItem.overrideHeight = COLLAPSED_H - PAD * 2

    const header = global.scene.createSceneObject("Header")
    header.setParent(this.indicatorRoot)
    this.headerFlex = header.createComponent(FlexLayout.getTypeName()) as FlexLayout
    this.headerFlex.direction = FlexDirection.Row
    this.headerFlex.alignItems = FlexAlign.Center
    this.headerFlex.columnGap = 0.4
    this.headerFlex.width = PLATE_W - PAD * 2
    this.headerFlex.height = TITLE_H
    const headerItem = header.createComponent(FlexItem.getTypeName()) as FlexItem
    headerItem.alignSelf = FlexAlignSelf.Stretch
    headerItem.overrideHeight = TITLE_H
    this.titleText = this.addLine(header, "Title", "Subheadline", TITLE_H)

    this.statusText = this.addLine(this.indicatorRoot, "Status", "Callout", LINE_H)
    this.activityText = this.addLine(this.indicatorRoot, "Activity", "Caption", LINE_H)
    this.activityObject = this.activityText.getSceneObject()
    this.activityItem = this.activityObject.getComponent(FlexItem.getTypeName()) as FlexItem
    this.addHitButton(this.indicatorRoot)

    this.expandedRoot = global.scene.createSceneObject("ExpandedBody")
    this.expandedRoot.setParent(content)
    this.expandedFlex = this.expandedRoot.createComponent(FlexLayout.getTypeName()) as FlexLayout
    this.expandedFlex.width = PLATE_W - PAD * 2
    this.expandedFlex.height = -1
    this.expandedFlex.direction = FlexDirection.Column
    this.expandedFlex.alignItems = FlexAlign.Stretch
    this.expandedFlex.justifyContent = FlexJustify.Start
    this.expandedFlex.rowGap = 0.2
    this.expandedItem = this.expandedRoot.createComponent(FlexItem.getTypeName()) as FlexItem
    this.expandedItem.alignSelf = FlexAlignSelf.Stretch
    this.expandedItem.overrideHeight = 0
    this.expandedRoot.enabled = false
    this.expandedTitle = this.addLine(this.expandedRoot, "OpenTitle", "Subheadline", OPEN_TITLE_H)
    this.expandedTitle.horizontalOverflow = HorizontalOverflow.Wrap
    this.expandedTitle.verticalAlignment = VerticalAlignment.Top
    const titleItem = this.expandedTitle.getSceneObject().getComponent(FlexItem.getTypeName()) as FlexItem
    if (titleItem) {
      titleItem.overrideWidth = PLATE_W - PAD * 2
    }

    this.transcript = new SessionTranscriptController(this.expandedRoot, PLATE_W - PAD * 2)
    this.composer = new SessionComposerUI(this.expandedRoot, PLATE_W - PAD * 2, {
      onMic: () => {
        if (this.session && this.handlers) {
          this.handlers.onMic(this.session.id)
        }
      },
      onSend: () => {
        if (this.session && this.handlers && this.composer) {
          this.handlers.onSend(this.session.id, this.composer.currentDraft())
        }
      },
      onCancel: () => {
        if (this.session && this.handlers) {
          this.handlers.onCancel(this.session.id)
        }
      },
      onChip: (text) => {
        if (this.session && this.handlers) {
          this.handlers.onSend(this.session.id, text)
        }
      },
    })

    this.orb = new SessionStatusOrb(this.sceneObject, this.orbMesh, this.glowMat)
    this.addCloseButton()
    this.ensureInteraction()
    this.createEvent("UpdateEvent").bind((event: UpdateEvent) => this.tick(event.getDeltaTime()))
    this.applyChrome(true)
  }

  private tick(dt: number): void {
    const target = this.expanded ? 1 : 0
    if (Math.abs(this.expandT - target) > 0.001) {
      const step = dt / EXPAND_SEC
      if (this.expandT < target) {
        this.expandT = Math.min(1, this.expandT + step)
      } else {
        this.expandT = Math.max(0, this.expandT - step)
      }
      this.applyChrome(false)
    }
    if (this.orb) {
      this.orb.update(dt)
    }
  }

  private ease(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  private bodyHeight(): number {
    const transcriptH = this.transcript ? this.transcript.currentHeight() : TRANSCRIPT_VIEW_H
    return OPEN_TITLE_H + 0.2 + transcriptH + 0.2 + COMPOSER_H
  }

  private applyChrome(immediate: boolean): void {
    if (immediate) {
      this.expandT = this.expanded ? 1 : 0
    }
    const k = this.ease(this.expandT)
    const bodyH = this.bodyHeight()
    const expandedH = PAD * 2 + bodyH
    const height = COLLAPSED_H + (expandedH - COLLAPSED_H) * k
    const inner = PLATE_W - PAD * 2
    if (this.plateHost) {
      this.plateHost.getTransform().setLocalPosition(new vec3(0, -height / 2, 0))
    }
    if (this.backPlate) {
      this.backPlate.size = new vec2(PLATE_W, height)
    }
    if (this.contentFlex) {
      this.contentFlex.width = inner
      this.contentFlex.height = height
    }
    if (this.headerFlex) {
      this.headerFlex.width = inner
    }
    if (this.expandedFlex) {
      this.expandedFlex.width = inner
      this.expandedFlex.height = bodyH * k
    }
    if (this.expandedTitle) {
      this.expandedTitle.layoutRect = Rect.create(-inner / 2, inner / 2 - 2.2, -OPEN_TITLE_H / 2, OPEN_TITLE_H / 2)
    }
    const showBody = k > 0.08
    const showIndicator = k < 0.88
    if (this.indicatorRoot && this.indicatorItem) {
      this.indicatorRoot.enabled = showIndicator
      this.indicatorItem.overrideHeight = (COLLAPSED_H - PAD * 2) * (1 - k)
    }
    this.fadeIndicator(1 - k)
    if (this.expandedRoot && this.expandedItem) {
      this.expandedRoot.enabled = showBody
      this.expandedItem.overrideHeight = bodyH * k
    }
    if (this.transcript) {
      this.transcript.setVisible(showBody)
      this.transcript.setWidth(inner)
    }
    if (this.composer) {
      this.composer.setVisible(showBody)
      this.composer.setWidth(inner)
    }
    if (this.hitButton) {
      this.hitButton.size = new vec3(inner, HIT_H, 1)
    }
    if (this.hitLabel) {
      this.hitLabel.text = k > 0.5 ? "Look / select" : "Look"
      this.hitLabel.layoutRect = Rect.create(-inner / 2, inner / 2, -HIT_H / 2, HIT_H / 2)
    }
    if (this.contentFlex) {
      this.contentFlex.markDirty()
    }
  }

  private addCloseButton(): void {
    const so = global.scene.createSceneObject(this.session ? "Close-" + this.session.id : "Close")
    so.setParent(this.sceneObject)
    so.getTransform().setLocalPosition(new vec3(PLATE_W / 2 - 1.35, 0.2, 0.95))
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(2.6, 2.6, 1)
    const label = global.scene.createSceneObject("CloseLabel")
    label.setParent(so)
    label.getTransform().setLocalPosition(new vec3(0, 0, 0.1))
    const text = label.createComponent("Component.Text") as Text
    text.text = "×"
    text.depthTest = true
    applyTextRole(text, "Button")
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.layoutRect = Rect.create(-1.3, 1.3, -1.3, 1.3)
    btn.onHoverEnter.add(() => {
      if (this.session && this.handlers) {
        this.handlers.onHoverStart(this.session.id)
      }
    })
    btn.onHoverExit.add(() => {
      if (!this.session || !this.handlers) {
        return
      }
      this.handlers.onHoverEnd(this.session.id)
      if (this.grabbing || this.expanded || getTime() < this.ignoreHoverEndUntil) {
        this.handlers.onHoverStay(this.session.id)
      }
    })
    btn.onTriggerUp.add(() => {
      if (this.session && this.handlers) {
        this.handlers.onClose(this.session.id)
      }
    })
  }

  private addHitButton(parent: SceneObject): FlexItem {
    const so = global.scene.createSceneObject(this.session ? "Select-" + this.session.id : "Select")
    so.setParent(parent)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(PLATE_W - PAD * 2, HIT_H, 1)
    const label = global.scene.createSceneObject("SelectLabel")
    label.setParent(so)
    label.getTransform().setLocalPosition(new vec3(0, 0, 0.08))
    const text = label.createComponent("Component.Text") as Text
    text.text = "Look"
    text.depthTest = true
    applyTextRole(text, "Button")
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.layoutRect = Rect.create(-(PLATE_W - PAD * 2) / 2, (PLATE_W - PAD * 2) / 2, -HIT_H / 2, HIT_H / 2)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideHeight = HIT_H
    this.hitButton = btn
    this.hitLabel = text
    this.bindHitButton(btn)
    return item
  }

  private fadeIndicator(alpha: number): void {
    const a = Math.max(0, Math.min(1, alpha))
    this.tintText(this.titleText, a)
    this.tintText(this.statusText, a)
    this.tintText(this.activityText, a)
    this.tintText(this.hitLabel, a)
  }

  private tintText(text: Text | null, alpha: number): void {
    if (!text) {
      return
    }
    const c = text.textFill.color
    text.textFill.color = new vec4(c.x, c.y, c.z, alpha)
  }

  private bindHitButton(btn: Button): void {
    btn.onHoverEnter.add(() => {
      if (this.session && this.handlers) {
        this.handlers.onHoverStart(this.session.id)
      }
    })
    btn.onHoverExit.add(() => {
      if (!this.session || !this.handlers) {
        return
      }
      this.handlers.onHoverEnd(this.session.id)
      if (this.grabbing || this.expanded || getTime() < this.ignoreHoverEndUntil) {
        this.handlers.onHoverStay(this.session.id)
      }
    })
    btn.onTriggerUp.add(() => {
      if (this.session && this.handlers) {
        this.handlers.onSelect(this.session.id)
      }
    })
  }

  private addLine(parent: SceneObject, name: string, role: "Subheadline" | "Callout" | "Caption", height: number): Text {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    const text = so.createComponent("Component.Text") as Text
    text.depthTest = true
    applyTextRole(text, role)
    text.horizontalAlignment = HorizontalAlignment.Left
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    const halfW = (PLATE_W - PAD * 2) / 2
    text.layoutRect = Rect.create(-halfW, halfW, -height / 2, height / 2)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideWidth = PLATE_W - PAD * 2
    item.overrideHeight = height
    return text
  }

  private ensureInteraction(): void {
    if (this.orb) {
      this.orb.enableGrab(this.sceneObject)
    }

    this.createEvent("OnStartEvent").bind(() => {
      const plate = this.plateHost
        ? (this.plateHost.getComponent(Interactable.getTypeName()) as Interactable)
        : null
      if (plate) {
        this.bindHoverable(plate)
      }
      const orbInteractable = this.orb ? this.orb.getInteractable() : null
      if (orbInteractable) {
        this.bindHoverable(orbInteractable)
      }
      const manipulation = this.orb ? this.orb.getManipulation() : null
      if (manipulation) {
        manipulation.onManipulationStart.add(() => {
          this.grabbing = true
          this.ignoreHoverEndUntil = getTime() + 999
          if (this.session && this.handlers) {
            this.handlers.onGrabStart(this.session.id)
          }
        })
        manipulation.onManipulationEnd.add(() => {
          this.grabbing = false
          this.ignoreHoverEndUntil = getTime() + 0.35
          if (this.session && this.handlers) {
            this.handlers.onGrabEnd(this.session.id)
          }
        })
      }
    })
  }

  private bindHoverable(live: Interactable): void {
    live.onHoverEnter.add(() => {
      if (this.session && this.handlers) {
        this.handlers.onHoverStart(this.session.id)
      }
    })
    live.onHoverExit.add((event: InteractorEvent) => {
      if (!this.session || !this.handlers) {
        return
      }
      this.handlers.onHoverEnd(this.session.id)
      if (this.shouldIgnoreHoverEnd(event)) {
        this.handlers.onHoverStay(this.session.id)
      }
    })
  }

  private shouldIgnoreHoverEnd(event: InteractorEvent): boolean {
    if (this.grabbing || getTime() < this.ignoreHoverEndUntil) {
      return true
    }
    const interactor = event.interactor as {currentInteractable?: {sceneObject?: SceneObject}}
    const next = interactor && interactor.currentInteractable
    const so = next && next.sceneObject
    return so ? this.isUnderSession(so) : false
  }

  private isUnderSession(so: SceneObject): boolean {
    let cur: SceneObject | null = so
    while (cur) {
      if (cur === this.sceneObject) {
        return true
      }
      cur = cur.getParent()
    }
    return false
  }

  private refresh(): void {
    if (!this.session) {
      return
    }
    this.refreshHeader()
    if (this.transcript) {
      this.transcript.render(this.session)
    }
    if (this.composer) {
      this.composer.bind(this.session)
    }
    if (this.expanded) {
      this.applyChrome(true)
    }
  }

  private refreshHeader(): void {
    if (!this.session) {
      return
    }
    if (this.titleText) {
      this.titleText.text = this.session.label
    }
    if (this.expandedTitle) {
      this.expandedTitle.text = this.session.label + "  ·  " + this.session.repo
    }
    if (this.statusText) {
      this.statusText.text = this.session.statusLabel
      this.statusText.textFill.color = this.expanded
        ? statusColor("selected")
        : statusColor(this.session.status)
    }
    if (this.activityText) {
      const sameAsStatus = this.session.activity === this.session.statusLabel
      const line = sameAsStatus ? this.session.task : this.session.activity
      this.activityText.text = line
      const showActivity = line.length > 0
      if (this.activityObject) {
        this.activityObject.enabled = showActivity
      }
      if (this.activityItem) {
        this.activityItem.overrideHeight = showActivity ? LINE_H : 0
      }
    }
  }

  private refreshOrb(): void {
    if (!this.orb) {
      return
    }
    this.orb.applyMood(this.orbMood())
  }

  private orbMood(): OrbMood {
    if (this.listening) {
      return "talking"
    }
    if (this.expanded) {
      return "gazed"
    }
    if (!this.session) {
      return "idle"
    }
    if (this.session.status === "blocked") {
      return "blocked"
    }
    if (this.session.status === "working") {
      return "working"
    }
    if (this.session.status === "done") {
      return "done"
    }
    return "idle"
  }
}
