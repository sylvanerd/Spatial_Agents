export type TextRole =
  | "Title1"
  | "Title2"
  | "HeadlineXL"
  | "Headline1"
  | "Headline2"
  | "Subheadline"
  | "Button"
  | "Callout"
  | "Body"
  | "Caption"

const FONT_SIZE_SCALE = 1.0

const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700},
  Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700},
  Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700},
  Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500},
  Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500},
  Caption: {size: 38, weight: 500},
}

export function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * FONT_SIZE_SCALE * (distanceCm / 110)
}

export function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = roleSize(role, distanceCm)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

export const STATUS_COLOR: Record<string, vec4> = {
  idle: new vec4(0.65, 0.67, 0.7, 1),
  working: new vec4(0.98, 0.75, 0.18, 1),
  blocked: new vec4(1.0, 0.55, 0.2, 1),
  done: new vec4(0.45, 0.86, 0.4, 1),
  selected: new vec4(0.45, 0.82, 1.0, 1),
}

export function statusColor(status: string): vec4 {
  return STATUS_COLOR[status] || STATUS_COLOR.idle
}

export const THEME = {
  working: new vec4(0.35, 0.22, 0.05, 1),
  waiting: new vec4(0.32, 0.16, 0.06, 1),
  done: new vec4(0.08, 0.22, 0.12, 1),
  idle: new vec4(0.12, 0.13, 0.15, 1),
}
