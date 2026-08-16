import {AgentProject} from "./ConductorTypes"
import {applyTextRole} from "./ConductorTheme"
import {ProjectFile} from "./ProjectFile"

const BASKET_POS = new vec3(0, -30, -100)
const SLOT_X = [-12, -4, 4, 12]
const FILE_Y = 2.2
const FILE_Z = 0.4

export class ProjectBasket {
  private root: SceneObject
  private files: ProjectFile[] = []

  constructor(
    parent: SceneObject,
    projects: AgentProject[],
    activeId: string,
    mesh: RenderMesh | null,
    material: Material | null,
    onOpen: (projectId: string) => void,
  ) {
    this.root = global.scene.createSceneObject("ProjectBasket")
    this.root.setParent(parent)
    this.root.getTransform().setLocalPosition(BASKET_POS)

    this.addTitle()

    projects.forEach((project, index) => {
      const x = SLOT_X[index] !== undefined ? SLOT_X[index] : (index - 1.5) * 11
      const file = new ProjectFile(
        this.root,
        project,
        new vec3(x, FILE_Y, FILE_Z),
        mesh,
        material,
        onOpen,
      )
      file.setSelected(project.id === activeId)
      this.files.push(file)
    })
  }

  public setActive(projectId: string): void {
    this.files.forEach((file) => {
      file.setSelected(file.projectId === projectId)
    })
  }

  public update(dt: number): void {
    this.files.forEach((file) => {
      file.update(dt)
    })
  }

  private addTitle(): void {
    const so = global.scene.createSceneObject("BasketTitle")
    so.setParent(this.root)
    so.getTransform().setLocalPosition(new vec3(0, 6.2, 0.4))
    const text = so.createComponent("Component.Text") as Text
    text.depthTest = true
    applyTextRole(text, "Headline2")
    text.text = "Projects"
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.layoutRect = Rect.create(-10, 10, -1.4, 1.4)
  }
}
