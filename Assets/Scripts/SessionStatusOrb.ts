import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"

export type OrbMood = "idle" | "gazed" | "talking" | "working" | "blocked" | "done"

const ORB_COLOR: Record<OrbMood, vec4> = {
  idle: new vec4(0.55, 0.58, 0.64, 1),
  gazed: new vec4(1.0, 0.48, 0.12, 1),
  talking: new vec4(1.0, 0.42, 0.08, 1),
  working: new vec4(1.0, 0.86, 0.18, 1),
  blocked: new vec4(1.0, 0.18, 0.16, 1),
  done: new vec4(0.28, 0.92, 0.42, 1),
}

const PULSE: Record<OrbMood, number> = {
  idle: 0.08,
  gazed: 0.22,
  talking: 1.15,
  working: 0.35,
  blocked: 0.45,
  done: 0.12,
}

export class SessionStatusOrb {
  private root: SceneObject
  private core: SceneObject
  private halo: SceneObject
  private coreMat: Material | null = null
  private haloMat: Material | null = null
  private mood: OrbMood = "idle"
  private color: vec4 = ORB_COLOR.idle
  private pulse: number = PULSE.idle
  private interactable: Interactable | null = null
  private manipulation: InteractableManipulation | null = null

  constructor(parent: SceneObject, mesh: RenderMesh | null, material: Material | null) {
    this.root = global.scene.createSceneObject("StatusOrb")
    this.root.setParent(parent)
    this.root.getTransform().setLocalPosition(new vec3(0, 2.45, 0.8))

    this.core = this.makeSphere("OrbCore", mesh, material, 3.2)
    this.halo = this.makeSphere("OrbHalo", mesh, material, 5.4)
    if (this.haloMat) {
      this.trySetPass(this.haloMat, new vec4(1, 0.45, 0.12, 0.35), 0.4)
    }
    this.applyMood("idle")
  }

  public getRoot(): SceneObject {
    return this.root
  }

  public getInteractable(): Interactable | null {
    return this.interactable
  }

  public getManipulation(): InteractableManipulation | null {
    return this.manipulation
  }

  public enableGrab(sessionRoot: SceneObject): void {
    const host = this.core
    if (!host.getComponent("Physics.ColliderComponent")) {
      const collider = host.createComponent("Physics.ColliderComponent") as ColliderComponent
      collider.fitVisual = true
      collider.intangible = false
    }
    if (!host.getComponent(Interactable.getTypeName())) {
      this.interactable = host.createComponent(Interactable.getTypeName()) as Interactable
    } else {
      this.interactable = host.getComponent(Interactable.getTypeName()) as Interactable
    }
    this.interactable.targetingMode = 3
    if (!host.getComponent(InteractableManipulation.getTypeName())) {
      this.manipulation = host.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
    } else {
      this.manipulation = host.getComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
    }
    this.manipulation.setCanTranslate(true)
    this.manipulation.setCanRotate(false)
    this.manipulation.setCanScale(false)
    this.manipulation.setManipulateRoot(sessionRoot.getTransform())
  }

  public applyMood(mood: OrbMood): void {
    this.mood = mood
    this.color = ORB_COLOR[mood]
    this.pulse = PULSE[mood]
    this.writeMaterials()
  }

  public update(_dt: number): void {
    if (this.mood !== "talking") {
      return
    }
    const beat = 0.5 + 0.5 * Math.sin(getTime() * 8.8)
    const scale = 5.4 + beat * 0.55
    this.halo.getTransform().setLocalScale(new vec3(scale, scale, scale))
  }

  private writeMaterials(): void {
    if (this.coreMat) {
      this.trySetPass(this.coreMat, this.color, this.pulse)
    }
    if (this.haloMat) {
      const soft = new vec4(this.color.x, this.color.y, this.color.z, 0.38)
      this.trySetPass(this.haloMat, soft, this.pulse * 1.15)
    }
  }

  private trySetPass(mat: Material, color: vec4, pulse: number): void {
    const pass = mat.mainPass
    pass.baseColor = color
    const glowPass = pass as Pass & {pulseAmount?: number; color?: vec4}
    glowPass.color = color
    if (glowPass.pulseAmount !== undefined) {
      glowPass.pulseAmount = pulse
    }
    pass.blendMode = BlendMode.Add
    pass.twoSided = true
  }

  private makeSphere(name: string, mesh: RenderMesh | null, material: Material | null, scale: number): SceneObject {
    const so = global.scene.createSceneObject(name)
    so.setParent(this.root)
    so.getTransform().setLocalScale(new vec3(scale, scale, scale))
    if (!mesh || !material) {
      return so
    }
    const visual = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    const cloned = material.clone()
    visual.mainMaterial = cloned
    visual.mesh = mesh
    if (name === "OrbCore") {
      this.coreMat = cloned
    } else {
      this.haloMat = cloned
    }
    return so
  }
}
