import {ConductorSession} from "./ConductorTypes"

const SILHOUETTE_SCALE = [
  new vec3(0.72, 0.72, 0.72),
  new vec3(0.62, 0.82, 0.62),
  new vec3(0.55, 0.95, 0.55),
  new vec3(0.64, 0.64, 0.72),
]

export class SessionAvatarController {
  private root: SceneObject
  private visual: RenderMeshVisual | null = null
  private material: Material | null = null

  constructor(parent: SceneObject, meshes: RenderMesh[], baseMaterial: Material | null) {
    this.root = global.scene.createSceneObject("AvatarMesh")
    this.root.setParent(parent)
    this.root.getTransform().setLocalPosition(new vec3(0, 0, 0.4))

    if (meshes.length === 0 || !baseMaterial) {
      return
    }

    this.visual = this.root.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    this.material = baseMaterial.clone()
    this.visual.mainMaterial = this.material
    this.visual.mesh = meshes[0]
  }

  public apply(session: ConductorSession, meshes: RenderMesh[]): void {
    if (!this.visual || !this.material || meshes.length === 0) {
      return
    }
    const hash = this.hash(session.label + session.task)
    const index = hash % meshes.length
    this.visual.mesh = meshes[index]
    this.root.getTransform().setLocalScale(SILHOUETTE_SCALE[index] || SILHOUETTE_SCALE[0])
    this.material.mainPass.baseColor = this.colorFromHash(hash)
  }

  public setLocalPosition(pos: vec3): void {
    this.root.getTransform().setLocalPosition(pos)
  }

  private hash(text: string): number {
    let value = 0
    for (let i = 0; i < text.length; i++) {
      value = (value * 31 + text.charCodeAt(i)) | 0
    }
    return Math.abs(value)
  }

  private colorFromHash(hash: number): vec4 {
    const hues = [
      new vec4(0.35, 0.62, 0.95, 1),
      new vec4(0.95, 0.55, 0.28, 1),
      new vec4(0.42, 0.82, 0.55, 1),
      new vec4(0.78, 0.5, 0.92, 1),
    ]
    return hues[hash % hues.length]
  }
}
