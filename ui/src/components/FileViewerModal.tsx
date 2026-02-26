import { useEffect, useRef } from 'react'

type FileViewerModalProps = {
  url: string
  title?: string
  onClose: () => void
}

export function FileViewerModal({ url, title, onClose }: FileViewerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-viewer-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          margin: 20,
          minHeight: 0,
          border: '1px solid var(--border)',
          borderRadius: 14,
          background: 'var(--panel)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <span id="file-viewer-title" style={{ fontWeight: 600, fontSize: 14 }}>
            {title ?? 'File viewer'}
          </span>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{ padding: '6px 10px', fontSize: 13 }}
          >
            Close
          </button>
        </div>
        <iframe
          ref={iframeRef}
          src={url}
          title={title ?? 'File preview'}
          style={{
            flex: 1,
            width: '100%',
            minHeight: 400,
            border: 'none',
            background: '#fff',
          }}
        />
      </div>
    </div>
  )
}
