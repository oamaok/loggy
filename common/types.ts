export type ImageAttachmentVersion = {
  mimeType: string
  width: number
  height: number
}

export type ImageAttachment = {
  id: string
  versions: ImageAttachmentVersion[]
}

export type LogEntry = {
  id: number
  textContent: string
  createdAt: string
  longitude: number
  latitude: number

  imageAttachments: ImageAttachment[]
}
