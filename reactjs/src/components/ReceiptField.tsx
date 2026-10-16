import { useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { imageFileUrl } from '../services/api';
import type { ImageInfo } from '../services/api';
import { compressImage } from '../utils/image';
import type { CompressedImage } from '../utils/image';
import { useImageViewer } from '../contexts/ImageViewerContext';

// Receipt picker embedded in every record dialog: preview thumbnail (click
// opens the full image in the global lightbox), upload/replace and remove.
// New picks are compressed client-side and only staged — the dialog applies
// them on save (pending / pendingDelete handled by the parent).
export default function ReceiptField({
  image,
  pending,
  pendingDelete,
  onPick,
  onRemove,
}: {
  image?: ImageInfo | null | undefined;
  pending?: CompressedImage | null | undefined;
  pendingDelete?: boolean | undefined;
  onPick: (compressed: CompressedImage) => void;
  onRemove: () => void;
}) {
  const { viewImage } = useImageViewer();
  const inputRef = useRef<HTMLInputElement>(null);

  const pendingUrl = useMemo(
    () => (pending ? URL.createObjectURL(pending.blob) : null),
    [pending],
  );
  useEffect(() => () => { if (pendingUrl) URL.revokeObjectURL(pendingUrl); }, [pendingUrl]);

  const fullUrl = pendingDelete ? null : pendingUrl ?? (image ? imageFileUrl(image.id) : null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      onPick(await compressImage(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : err);
    }
  };

  return (
    <div className="receipt-field">
      {fullUrl ? (
        <button
          type="button"
          className="receipt-thumb"
          title="查看全圖"
          aria-label="查看收據圖片"
          onClick={() => viewImage(fullUrl, '收據圖片')}
        >
          <img src={fullUrl} alt="" />
        </button>
      ) : (
        <button
          type="button"
          className="receipt-thumb receipt-thumb-empty"
          aria-label="上載收據圖片"
          onClick={() => inputRef.current?.click()}
        >
          🔗
        </button>
      )}
      <div className="receipt-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <button type="button" className="receipt-button" onClick={() => inputRef.current?.click()}>
          {fullUrl ? '更換圖片' : '上載收據'}
        </button>
        {fullUrl && (
          <button
            type="button"
            className="receipt-button danger"
            onClick={() => {
              if (window.confirm('確認刪除收據圖片?')) onRemove();
            }}
          >
            刪除
          </button>
        )}
      </div>
    </div>
  );
}
