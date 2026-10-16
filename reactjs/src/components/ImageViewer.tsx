import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ImageViewerContext } from '../contexts/ImageViewerContext';

// Global lightbox: any component calls viewImage(url) via useImageViewer().
// Mounted once in App.tsx so images open without prop-drilling.
export default function ImageViewer({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<{ url: string; alt: string } | null>(null);

  const viewImage = useCallback((url: string, alt?: string) => {
    setTarget({ url, alt: alt ?? '' });
  }, []);
  const close = useCallback(() => setTarget(null), []);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, close]);

  const api = useMemo(() => ({ viewImage }), [viewImage]);

  return (
    <ImageViewerContext.Provider value={api}>
      {children}
      {target && (
        <div className="dialog-backdrop lightbox-backdrop" onClick={close}>
          <div className="lightbox" onClick={e => e.stopPropagation()}>
            <button
              className="icon-button lightbox-close"
              title="關閉"
              aria-label="關閉圖片"
              onClick={close}>
              ✖
            </button>
            <img className="lightbox-image" src={target.url} alt={target.alt} />
          </div>
        </div>
      )}
    </ImageViewerContext.Provider>
  );
}
