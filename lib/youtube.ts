/**
 * Utility functions for handling YouTube URLs
 */

/**
 * Extract video ID from YouTube URL or embed code
 * Handles:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - <iframe src="https://www.youtube.com/embed/ID"></iframe>
 * - Raw video ID (11 chars)
 */
export function extractYouTubeId(input: string): string | null {
  if (!input) return null

  // If it's an iframe embed code like: <iframe src="https://www.youtube.com/embed/ID"></iframe>
  const iframeMatch = input.match(/src="https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)
  if (iframeMatch) return iframeMatch[1]

  // If it's a plain embed URL like: https://www.youtube.com/embed/ID
  const embedMatch = input.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
  if (embedMatch) return embedMatch[1]

  // Standard YouTube URL: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
  const standardMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (standardMatch) return standardMatch[1]

  // If it's just the video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input

  return null
}

/**
 * Generate YouTube embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Generate YouTube embed iframe HTML
 */
export function getYouTubeEmbed(videoId: string, title: string = 'Video'): string {
  return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
}

/**
 * Check if a URL is a YouTube URL or video ID
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null
}

/**
 * Normalize YouTube URL to embed format
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = extractYouTubeId(url)
  if (!videoId) return null
  return getYouTubeEmbedUrl(videoId)
}
