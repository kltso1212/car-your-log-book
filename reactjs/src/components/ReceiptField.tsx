import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { imageFileUrl } from '../services/api';
import type { ImageInfo } from '../services/api';
import { IMAGE_ACCEPT, compressImage, isAcceptedImage } from '../utils/image';
import type { CompressedImage } from '../utils/image';
import { useImageViewer } from '../contexts/ImageViewerContext';

// Receipt picker embedded in every record dialog: preview thumbnail (click
// opens the full image in the global lightbox), upload/replace, camera and
// remove; the drop zone also accepts drag&drop. New picks are compressed
// client-side and only staged — the dialog applies them on save
// (pending / pendingDelete handled by the parent).
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
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pendingUrl = useMemo(
    () => (pending ? URL.createObjectURL(pending.blob) : null),
    [pending],
  );
  useEffect(() => () => { if (pendingUrl) URL.revokeObjectURL(pendingUrl); }, [pendingUrl]);

  const fullUrl = pendingDelete ? null : pendingUrl ?? (image ? imageFileUrl(image.id) : null);

  const processFile = async (file: File) => {
    if (!isAcceptedImage(file)) {
      alert('只接受 JPG、PNG 或 WebP 圖片');
      return;
    }
    try {
      onPick(await compressImage(file));
    } catch (err) {
      alert(err instanceof Error ? err.message : err);
    }
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void processFile(file);
  };

  const dragHasFiles = (e: DragEvent<HTMLDivElement>) =>
    Array.from(e.dataTransfer.types).includes('Files');

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!dragHasFiles(e)) return;
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!dragHasFiles(e)) return;
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  return (
    <div
      className={`receipt-field${dragOver ? ' drag-over' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
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
          accept={IMAGE_ACCEPT}
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <button type="button" className="receipt-button" onClick={() => inputRef.current?.click()}>
          {fullUrl ? '更換圖片' : '上載收據'}
        </button>
        <button type="button" className="receipt-button" onClick={() => cameraRef.current?.click()}>
          📷 拍照
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
