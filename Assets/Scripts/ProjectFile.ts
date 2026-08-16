import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {AgentProject} from "./ConductorTypes"
import {applyTextRole} from "./ConductorTheme"

const FILE_SCALE = new vec3(4.6, 6.2, 1.4)
const LIFT = new vec3(0, 4.2, 2.0)
const SELECTED = new vec3(0, 1.4, 0.5)
const LIFT_SPEED = 11

const FILE_TINT: Record<string, vec4> = {
  "project-a": new vec4(0.32, 0.58, 0.95, 1),
  "project-b": new vec4(0.95, 0.62, 0.22, 1),
  "project-c": new vec4(0.36, 0.82, 0.48, 1),
  stuff: new vec4(0.62, 0.52, 0.82, 1),
}

export class ProjectFile {
  public readonly projectId: string
  private root: SceneObject
  private rest: vec3
  private visual: SceneObject
  private material: Material | null = null
  private hovered: boolean = false
  private selected: boolean = false
  private liftK: number = 0

  constructor(
    parent: SceneObject,
    project: AgentProject,
    rest: vec3,
    mesh: RenderMesh | null,
    material: Material | null,
    onOpen: (projectId: string) => void,
  ) {
    this.projectId = project.id
    this.rest = rest
    this.root = global.scene.createSceneObject("File-" + project.id)
    this.root.setParent(parent)
    this.root.getTransform().setLocalPosition(rest)

    this.visual = global.scene.createSceneObject("FileMesh")
    this.visual.setParent(this.root)
    this.visual.getTransform().setLocalPosition(new vec3(0, 0.8, 0.2))
    this.visual.getTransform().setLocalScale(FILE_SCALE)

    if (mesh && material) {
      const rmv = this.visual.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
      this.material = material.clone()
      rmv.mainMaterial = this.material
      rmv.mesh = mesh
      this.writeTint()
    }

    const hit = global.scene.createSceneObject("FileHit")
    hit.setParent(this.root)
    const btn = hit.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(6.4, 8.2, 1)
    btn.onHoverEnter.add(() => {
      this.hovered = true
      this.writeTint()
    })
    btn.onHoverExit.add(() => {
      this.hovered = false
      this.writeTint()
    })
    btn.onTriggerUp.add(() => {
      onOpen(project.id)
    })

    this.addLabel(project.label)
  }

  public setSelected(selected: boolean): void {
    this.selected = selected
    this.writeTint()
  }

  public update(dt: number): void {
    const target = this.hovered ? 1 : this.selected ? 0.28 : 0
    this.liftK += (target - this.liftK) * Math.min(1, dt * LIFT_SPEED)
    const lift = this.hovered ? LIFT : SELECTED
    const offset = new vec3(lift.x * this.liftK, lift.y * this.liftK, lift.z * this.liftK)
    this.root.getTransform().setLocalPosition(new vec3(this.rest.x + offset.x, this.rest.y + offset.y, this.rest.z + offset.z))
  }

  private writeTint(): void {
    if (!this.material) {
      return
    }
    const base = FILE_TINT[this.projectId] || FILE_TINT.stuff
    const boost = this.selected || this.hovered ? 1.18 : 1
    const color = new vec4(
      Math.min(1, base.x * boost),
      Math.min(1, base.y * boost),
      Math.min(1, base.z * boost),
      1,
    )
    this.material.mainPass.baseColor = color
  }

  private addLabel(label: string): void {
    const so = global.scene.createSceneObject("FileLabel")
    so.setParent(this.root)
    so.getTransform().setLocalPosition(new vec3(0, -4.4, 0.9))
    const text = so.createComponent("Component.Text") as Text
    text.depthTest = true
    applyTextRole(text, "Callout")
    text.text = label
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.layoutRect = Rect.create(-5.2, 5.2, -1.1, 1.1)
  }
}
