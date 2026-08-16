export function isPreviewEditor(): boolean {
  try {
    const info = global.deviceInfoSystem as unknown as {isEditor?: () => boolean}
    if (info && info.isEditor) {
      return info.isEditor()
    }
  } catch (err) {
    return false
  }
  return false
}
