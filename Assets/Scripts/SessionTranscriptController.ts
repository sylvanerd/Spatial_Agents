import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlignSelf} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {ConductorSession, TranscriptMessage} from "./ConductorTypes"
import {applyTextRole} from "./ConductorTheme"

export const TRANSCRIPT_VIEW_H = 12.0
const LINE_H = 1.05
const CHAR_W = 0.55
const ROW_GAP = 0.22

type RowBits = {
  root: SceneObject
  text: Text
  item: FlexItem
  height: number
}

export class SessionTranscriptController {
  public root: SceneObject
  public flexItem: FlexItem
  private width: number
  private viewH: number = TRANSCRIPT_VIEW_H
  private rows: RowBits[] = []
  private packedH: number = LINE_H * 2

  constructor(parent: SceneObject, width: number) {
    this.width = width
    this.root = global.scene.createSceneObject("Transcript")
    this.root.setParent(parent)
    this.flexItem = this.root.createComponent(FlexItem.getTypeName()) as FlexItem
    this.flexItem.alignSelf = FlexAlignSelf.Stretch
    this.flexItem.overrideWidth = width
    this.flexItem.overrideHeight = this.packedH
  }

  public currentHeight(): number {
    return this.packedH
  }

  public setVisible(visible: boolean): void {
    this.root.enabled = visible
  }

  public setWidth(width: number): void {
    if (Math.abs(this.width - width) < 0.01) {
      return
    }
    this.width = width
    this.flexItem.overrideWidth = width
    this.rows.forEach((row) => {
      row.item.overrideWidth = width
      this.sizeText(row.text, row.height)
    })
    this.placeRows()
  }

  public render(session: ConductorSession): void {
    this.clearRows()
    this.messagesToShow(session).forEach((message) => {
      this.rows.push(this.addRow(message, session.label))
    })
    this.packedH = this.contentHeight()
    this.flexItem.overrideHeight = this.packedH
    this.placeRows()
  }

  private clearRows(): void {
    this.rows.forEach((row) => row.root.destroy())
    this.rows = []
  }

  private messagesToShow(session: ConductorSession): TranscriptMessage[] {
    const picked: TranscriptMessage[] = []
    let used = 0
    for (let i = session.messages.length - 1; i >= 0; i--) {
      const height = this.heightFor(this.format(session.messages[i], session.label))
      const gap = picked.length > 0 ? ROW_GAP : 0
      if (picked.length > 0 && used + gap + height > this.viewH) {
        break
      }
      picked.unshift(session.messages[i])
      used += gap + height
    }
    return picked.length > 0 ? picked : session.messages.slice(-1)
  }

  private contentHeight(): number {
    let h = 0
    this.rows.forEach((row, index) => {
      h += row.height
      if (index < this.rows.length - 1) {
        h += ROW_GAP
      }
    })
    return Math.max(LINE_H * 2, h)
  }

  private addRow(message: TranscriptMessage, agentLabel: string): RowBits {
    const copy = this.format(message, agentLabel)
    const height = this.heightFor(copy)
    const so = global.scene.createSceneObject("Row-" + message.id)
    so.setParent(this.root)
    const text = so.createComponent("Component.Text") as Text
    text.depthTest = true
    applyTextRole(text, message.role === "assistant" ? "Body" : "Caption")
    text.text = copy
    text.horizontalAlignment = HorizontalAlignment.Left
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Wrap
    text.verticalOverflow = VerticalOverflow.Overflow
    text.textFill.color = this.colorFor(message.role)
    this.sizeText(text, height)
    const item = so.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideWidth = this.width
    item.overrideHeight = height
    return {root: so, text: text, item: item, height: height}
  }

  private placeRows(): void {
    let y = this.packedH / 2
    this.rows.forEach((row) => {
      y -= row.height / 2
      row.root.getTransform().setLocalPosition(new vec3(0, y, 0.05))
      y -= row.height / 2 + ROW_GAP
    })
  }

  private sizeText(text: Text, height: number): void {
    const halfW = this.width / 2
    const halfH = Math.max(height, LINE_H) / 2
    text.layoutRect = Rect.create(-halfW, halfW, -halfH, halfH)
  }

  private format(message: TranscriptMessage, agentLabel: string): string {
    return this.speakerFor(message, agentLabel) + "\n" + message.text
  }

  private speakerFor(message: TranscriptMessage, agentLabel: string): string {
    if (message.role === "user") {
      return "You"
    }
    if (message.role === "tool") {
      return "Tool" + (message.toolStatus ? "  ·  " + message.toolStatus : "")
    }
    if (message.role === "alert") {
      return "Alert"
    }
    return agentLabel
  }

  private colorFor(role: string): vec4 {
    if (role === "user") {
      return new vec4(0.75, 0.86, 1, 1)
    }
    if (role === "tool") {
      return new vec4(1, 0.82, 0.45, 1)
    }
    if (role === "alert") {
      return new vec4(1, 0.55, 0.45, 1)
    }
    return new vec4(0.88, 0.9, 0.86, 1)
  }

  private heightFor(text: string): number {
    return this.lineCount(text) * LINE_H
  }

  private lineCount(text: string): number {
    const perLine = Math.max(10, Math.floor(this.width / CHAR_W))
    const parts = text.split("\n")
    let lines = 0
    parts.forEach((part) => {
      lines += Math.max(1, Math.ceil(Math.max(1, part.length) / perLine))
    })
    return Math.max(2, lines)
  }
}
