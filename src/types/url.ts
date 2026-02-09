export interface ShortUrl {
  shortCode: string
  originalUrl: string
  createdAt: Date
  clickCount: number
}

export interface CreateUrlRequest {
  originalUrl: string
}
