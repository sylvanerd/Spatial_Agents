import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexAlign, FlexDirection, FlexJustify} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {applyTextRole} from "./ConductorTheme"

const PANEL_W = 34
const PAD = 1.2

@component
export class ConductorHudUI extends BaseScriptComponent {
  private modeText: Text | null = null
  private countText: Text | null = null
  private onToggle: (() => void) | null = null
  private onAdd: (() => void) | null = null

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    const plate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate

    const content = global.scene.createSceneObject("HudContent")
    content.setParent(this.sceneObject)
    content.getTransform().setLocalPosition(new vec3(0, 0, 0.6))

    const flex = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    flex.width = PANEL_W
    flex.height = -1
    flex.direction = FlexDirection.Row
    flex.alignItems = FlexAlign.Center
    flex.justifyContent = FlexJustify.SpaceBetween
    flex.columnGap = 0.9
    flex.paddingTop = PAD
    flex.paddingBottom = PAD
    flex.paddingLeft = PAD
    flex.paddingRight = PAD
    flex.onLayoutComplete.add((result) => {
      plate.size = new vec2(result.containerWidth, result.containerHeight)
    })

    this.modeText = this.addLabel(content, "Offline mock", 14)
    this.countText = this.addLabel(content, "3 sessions", 9)
    this.addPlus(content)
    this.addToggle(content)
    this.createEvent("UpdateEvent").bind(() => this.hushInteractionPlanes(this.sceneObject))
  }

  private hushInteractionPlanes(root: SceneObject): void {
    const n = root.getChildrenCount()
    for (let i = 0; i < n; i++) {
      const child = root.getChild(i)
      if (child.name === "InteractionPlaneColliderRoot") {
        child.enabled = false
      }
      this.hushInteractionPlanes(child)
    }
  }

  public bindToggle(fn: () => void): void {
    this.onToggle = fn
  }

  public bindAdd(fn: () => void): void {
    this.onAdd = fn
  }

  public setMode(live: boolean, count: number): void {
    if (this.modeText) {
      this.modeText.text = live ? "Live" : "Offline mock"
      this.modeText.textFill.color = live
        ? new vec4(0.45, 0.86, 0.5, 1)
        : new vec4(0.85, 0.86, 0.88, 1)
    }
    if (this.countText) {
      this.countText.text = count + " sessions"
    }
  }

  private addLabel(parent: SceneObject, label: string, width: number): Text {
    const so = global.scene.createSceneObject(label)
    so.setParent(parent)
    const text = so.createComponent("Component.Text") as Text
    text.depthTest = true
    applyTextRole(text, "Callout")
    text.text = label
    text.horizontalAlignment = HorizontalAlignment.Left
    text.verticalAlignment = VerticalAlignment.Center
    text.layoutRect = Rect.create(-width / 2, width / 2, -1.3, 1.3)
    so.createComponent(FlexItem.getTypeName())
    return text
  }

  private addPlus(parent: SceneObject): void {
    const so = global.scene.createSceneObject("AddSession")
    so.setParent(parent)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(2.8, 2.4, 1)
    const plus = global.scene.createSceneObject("AddLabel")
    plus.setParent(so)
    plus.getTransform().setLocalPosition(new vec3(0, 0, 0.1))
    const text = plus.createComponent("Component.Text") as Text
    text.text = "+"
    text.depthTest = true
    applyTextRole(text, "Button")
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.layoutRect = Rect.create(-1.2, 1.2, -1.1, 1.1)
    so.createComponent(FlexItem.getTypeName())
    btn.onTriggerUp.add(() => {
      if (this.onAdd) {
        this.onAdd()
      }
    })
  }

  private addToggle(parent: SceneObject): void {
    const so = global.scene.createSceneObject("LiveToggle")
    so.setParent(parent)
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(8.5, 2.4, 1)
    const label = global.scene.createSceneObject("LiveLabel")
    label.setParent(so)
    const text = label.createComponent("Component.Text") as Text
    text.text = "Live"
    text.depthTest = true
    applyTextRole(text, "Button")
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.layoutRect = Rect.create(-4, 4, -1.1, 1.1)
    so.createComponent(FlexItem.getTypeName())
    btn.onTriggerUp.add(() => {
      if (this.onToggle) {
        this.onToggle()
      }
    })
  }
}
