import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {ConductorSession} from "./ConductorTypes"
import {applyTextRole} from "./ConductorTheme"

const INPUT_H = 3.6
const INPUT_PAD = 0.4
const CHAR_W = 0.55
const INPUT_LINES = 3

export type ComposerHandlers = {
  onMic: () => void
  onSend: () => void
  onCancel: () => void
  onChip: (text: string) => void
}

export class SessionComposerUI {
  public root: SceneObject
  public flexItem: FlexItem
  private hintText: Text | null = null
  private dividerText: Text | null = null
  private session: ConductorSession | null = null
  private draft: string = ""
  private listening: boolean = false
  private handlers: ComposerHandlers
  private width: number
  private flex: FlexLayout
  private buttonRowFlex: FlexLayout | null = null
  private chipButton: Button | null = null
  private chipLabel: Text | null = null

  constructor(parent: SceneObject, width: number, handlers: ComposerHandlers) {
    this.width = width
    this.handlers = handlers
    this.root = global.scene.createSceneObject("HumanInput")
    this.root.setParent(parent)
    this.flex = this.root.createComponent(FlexLayout.getTypeName()) as FlexLayout
    this.flex.width = width
    this.flex.height = 11.2
    this.flex.direction = FlexDirection.Column
    this.flex.alignItems = FlexAlign.Stretch
    this.flex.justifyContent = FlexJustify.Start
    this.flex.rowGap = 0.3
    this.flex.paddingTop = 0.15
    this.flexItem = this.root.createComponent(FlexItem.getTypeName()) as FlexItem
    this.flexItem.alignSelf = FlexAlignSelf.Stretch
    this.flexItem.overrideWidth = width
    this.flexItem.overrideHeight = 11.2

    this.addDivider("Your voice or text")
    this.hintText = this.addHint("Look here, then speak or type a command…")
    this.addButtonRow()
    this.addChip()
  }

  public bind(session: ConductorSession): void {
    this.session = session
    if (!this.listening && this.draft.length === 0) {
      this.setHintCopy(session.composerHint)
    }
  }

  public setVisible(visible: boolean): void {
    this.root.enabled = visible
  }

  public setWidth(width: number): void {
    if (Math.abs(this.width - width) < 0.01) {
      return
    }
    this.width = width
    this.flex.width = width
    this.flexItem.overrideWidth = width
    if (this.buttonRowFlex) {
      this.buttonRowFlex.width = width
    }
    if (this.chipButton) {
      this.chipButton.size = new vec3(width, 2.4, 1)
    }
    if (this.chipLabel) {
      this.chipLabel.layoutRect = Rect.create(-width / 2 + 0.4, width / 2 - 0.4, -1.1, 1.1)
    }
    this.sizeLabel(this.dividerText, width, 1.4)
    this.sizeHint()
    this.flex.markDirty()
  }

  private sizeLabel(text: Text | null, width: number, height: number): void {
    if (!text) {
      return
    }
    text.layoutRect = Rect.create(-width / 2, width / 2, -height / 2, height / 2)
  }

  public setListening(listening: boolean, partial: string): void {
    this.listening = listening
    if (!this.hintText || !this.session) {
      return
    }
    if (listening) {
      this.setHintCopy(
        "Listening • " + this.session.label + (partial.length > 0 ? "  " + partial : "")
      )
    } else if (this.draft.length === 0) {
      this.setHintCopy(this.session.composerHint)
    }
  }

  public setDraft(text: string): void {
    this.draft = text
    if (text.length > 0) {
      this.setHintCopy(text)
    } else if (this.session) {
      this.setHintCopy(this.session.composerHint)
    }
  }

  public currentDraft(): string {
    if (this.draft.length > 0) {
      return this.draft
    }
    return this.session ? this.session.commandChip : ""
  }

  public clearDraft(): void {
    this.draft = ""
    this.listening = false
    if (this.session) {
      this.setHintCopy(this.session.composerHint)
    }
  }

  private addDivider(label: string): FlexItem {
    const so = global.scene.createSceneObject("InputSection")
    so.setParent(this.root)
    const text = so.createComponent("Component.Text") as Text
    text.depthTest = true
    applyTextRole(text, "Caption")
    text.text = label
    text.horizontalAlignment = HorizontalAlignment.Left
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    text.textFill.color = new vec4(0.7, 0.72, 0.75, 1)
    text.layoutRect = Rect.create(-this.width / 2, this.width / 2, -0.7, 0.7)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideWidth = this.width
    item.overrideHeight = 1.4
    this.dividerText = text
    return item
  }

  private addHint(label: string): Text {
    const so = global.scene.createSceneObject("InputBox")
    so.setParent(this.root)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideWidth = this.width
    item.overrideHeight = INPUT_H
    const labelSo = global.scene.createSceneObject("InputBoxText")
    labelSo.setParent(so)
    labelSo.getTransform().setLocalPosition(new vec3(0, 0, 0.08))
    const text = labelSo.createComponent("Component.Text") as Text
    text.depthTest = true
    applyTextRole(text, "Body")
    text.horizontalAlignment = HorizontalAlignment.Left
    text.verticalAlignment = VerticalAlignment.Top
    text.horizontalOverflow = HorizontalOverflow.Wrap
    text.verticalOverflow = VerticalOverflow.Truncate
    text.textFill.color = new vec4(0.82, 0.84, 0.88, 1)
    this.hintText = text
    this.sizeHint()
    this.setHintCopy(label)
    return text
  }

  private setHintCopy(raw: string): void {
    if (!this.hintText) {
      return
    }
    this.hintText.text = this.fitCopy(raw)
    this.sizeHint()
  }

  private sizeHint(): void {
    if (!this.hintText) {
      return
    }
    const halfW = this.width / 2 - INPUT_PAD
    const halfH = INPUT_H / 2 - 0.15
    this.hintText.layoutRect = Rect.create(-halfW, halfW, -halfH, halfH)
  }

  private fitCopy(text: string): string {
    const innerW = Math.max(4, this.width - INPUT_PAD * 2)
    const perLine = Math.max(8, Math.floor(innerW / CHAR_W))
    const maxChars = perLine * INPUT_LINES
    if (text.length <= maxChars) {
      return text
    }
    return "…" + text.substring(text.length - (maxChars - 1))
  }

  private addButtonRow(): FlexItem {
    const row = global.scene.createSceneObject("InputButtons")
    row.setParent(this.root)
    const flex = row.createComponent(FlexLayout.getTypeName()) as FlexLayout
    this.buttonRowFlex = flex
    flex.direction = FlexDirection.Row
    flex.alignItems = FlexAlign.Center
    flex.justifyContent = FlexJustify.Start
    flex.columnGap = 0.5
    flex.width = this.width
    flex.height = 2.6
    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideHeight = 2.6
    this.addButton(row, "Mic", 4.6, () => this.handlers.onMic())
    this.addButton(row, "Send", 5.0, () => this.handlers.onSend())
    this.addButton(row, "Cancel", 5.6, () => this.handlers.onCancel())
    return item
  }

  private addChip(): FlexItem {
    const chip = global.scene.createSceneObject("Chip")
    chip.setParent(this.root)
    const chipBtn = chip.createComponent(Button.getTypeName()) as Button
    chipBtn.size = new vec3(this.width, 2.4, 1)
    this.chipButton = chipBtn
    this.chipLabel = this.addButtonLabel(chip, "Use suggested command", this.width - 0.8)
    const item = chip.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideWidth = this.width
    item.overrideHeight = 2.4
    chipBtn.onTriggerUp.add(() => {
      if (this.session) {
        this.handlers.onChip(this.session.commandChip)
      }
    })
    return item
  }

  private addButton(parent: SceneObject, label: string, width: number, onClick: () => void): FlexItem {
    const so = global.scene.createSceneObject(label)
    so.setParent(parent)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(width, 2.2, 1)
    this.addButtonLabel(so, label, width - 0.5)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = width
    item.overrideHeight = 2.2
    btn.onTriggerUp.add(onClick)
    return item
  }

  private addButtonLabel(parent: SceneObject, label: string, width: number): Text {
    const so = global.scene.createSceneObject(label + "Label")
    so.setParent(parent)
    so.getTransform().setLocalPosition(new vec3(0, 0, 0.08))
    const text = so.createComponent("Component.Text") as Text
    text.text = label
    text.depthTest = true
    applyTextRole(text, "Button")
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.layoutRect = Rect.create(-width / 2, width / 2, -1.0, 1.0)
    return text
  }
}
