import type { ReactNode } from 'react'
import type { DemoViewerOption } from '../../types/video'

export const renderDemoMedia = (option: DemoViewerOption | undefined, title: string): ReactNode => {
  if (!option) return null

  // YouTube search link cannot be embedded; open a search page in a new tab.
  if (option.source === 'search') {
    return (
      <a
        href={option.embedUrl}
        target="_blank"
        rel="noreferrer"
        className="demo-search-card"
      >
        <span className="demo-search-icon">▶</span>
        <span>Buscar "{option.searchQuery}" no YouTube</span>
      </a>
    )
  }

  if (option.mediaType === 'image') {
    return <img src={option.embedUrl} alt={title} className="demo-image" loading="lazy" />
  }

  if (option.mediaType === 'video') {
    return (
      <video className="demo-video" controls playsInline preload="metadata">
        <source src={option.embedUrl} />
        Seu navegador nao suporta video embutido.
      </video>
    )
  }

  return (
    <iframe
      title={title}
      src={option.embedUrl}
      className="demo-iframe"
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  )
}
