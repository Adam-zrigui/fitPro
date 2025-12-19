"use client"

import React, { useState } from 'react'

interface Props {
  src: string | null | undefined
  alt?: string
  className?: string
  fallback?: 'gradient' | 'icon'
}

export default function ImageWithFallback({ src, alt = '', className = '', fallback = 'gradient' }: Props) {
  const [errored, setErrored] = useState(false)

  if (!src || errored) {
    // Render a simple placeholder using the same size classes
    const placeholderClasses = `${className || ''} flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400 text-white`
    return (
      <div className={placeholderClasses} aria-hidden="true">
        {fallback === 'icon' ? <span className="text-lg">▶️</span> : <span className="text-3xl">💪</span>}
      </div>
    )
  }

  return (
    // eslint-disable-next-line jsx-a11y/img-redundant-alt
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  )
}
