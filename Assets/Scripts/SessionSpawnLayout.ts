const HEIGHT_CM = 7
const DEPTH_CM = -118
const ROW_SPAN = 48

export class SessionSpawnLayout {
  public positionForIndex(index: number, count: number = 3): vec3 {
    if (count <= 1) {
      return new vec3(0, HEIGHT_CM, DEPTH_CM)
    }
    const span = Math.min(ROW_SPAN, 22 * (count - 1))
    const x = -span / 2 + (span / (count - 1)) * index
    return new vec3(x, HEIGHT_CM, DEPTH_CM)
  }

  public rotationForIndex(_index: number): quat {
    return quat.quatIdentity()
  }
}
