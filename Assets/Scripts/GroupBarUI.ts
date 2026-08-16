import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"

const BAR_W = 14
const BAR_H = 1.6

@component
export class GroupBarUI extends BaseScriptComponent {
  private manipulation: InteractableManipulation | null = null
  private groupRoot: SceneObject | null = null

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    const plate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.size = new vec2(BAR_W, BAR_H)

    this.manipulation = this.sceneObject.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
    this.manipulation.setCanTranslate(true)
    this.manipulation.setCanRotate(false)
    this.manipulation.setCanScale(false)
    if (this.groupRoot) {
      this.manipulation.setManipulateRoot(this.groupRoot.getTransform())
    }

    this.createEvent("UpdateEvent").bind(() => this.hushInteractionPlanes(this.sceneObject))
  }

  public bindGroupRoot(root: SceneObject): void {
    this.groupRoot = root
    if (this.manipulation) {
      this.manipulation.setManipulateRoot(root.getTransform())
    }
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
}
