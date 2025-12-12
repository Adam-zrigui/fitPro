'use client'

import { useState } from 'react'

interface ImageFallbackProps {
  src: string | null
  alt: string
  className?: string
}

export default function ImageFallback({ src, alt, className = '' }: ImageFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 dark:from-blue-700 dark:via-blue-800 dark:to-cyan-700">
        <span className="text-white text-9xl drop-shadow-lg">💪</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={() => setIsLoading(false)}
      onError={() => {
        console.warn(`Failed to load image: ${src}`)
        setIsLoading(false)
        setHasError(true)
      }}
      style={{
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  )
}

