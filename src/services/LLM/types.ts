export interface Wall {
  type: 'wall'
  start: [number, number]
  end: [number, number]
  height: number
}

export interface Door {
  type: 'door'
  position: [number, number]
  width: number
}

export interface Window {
  type: 'window'
  position: [number, number]
  width: number
}

export type SceneObject = Wall | Door | Window

export interface Scene {
  objects: SceneObject[]
}

export interface BlueprintImage {
  url?: string
  data?: string
}

export type Blueprint = string | BlueprintImage

export interface ContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string }
}
