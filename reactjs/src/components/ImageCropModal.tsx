import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { cropSquareBlob } from '../utils/image';
import type { CompressedImage } from '../utils/image';

// Interactive square cropper for vehicle avatars: drag/zoom the frame over
// the (already compressed) image; confirm exports a 512x512 square blob.
export default function ImageCropModal({
  src,
  onCancel,
  onConfirm,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (result: CompressedImage) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!area || busy) return;
    setBusy(true);
    try {
      onConfirm(await cropSquareBlob(src, area));
    } catch (err) {
      alert(err instanceof Error ? err.message : err);
    } finally {
      setBusy(false);
    }
  };

  // Portaled out of the vehicle dialog: the field lives inside a <label>
  // bound to the hidden file input, and clicks on non-interactive modal
  // content would otherwise be forwarded to it (opening the file picker).
  return createPortal(
    <div className="dialog-backdrop" onClick={onCancel}>
      <div className="dialog crop-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h2>裁剪圖片</h2>
        <p className="hint">拖動圖片或使用縮放，將方框對準要顯示的範圍。</p>
        <div className="crop-container">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <label className="crop-zoom">
          縮放
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
          />
        </label>
        <div className="dialog-actions">
          <button type="button" onClick={onCancel}>取消</button>
          <button type="button" onClick={handleConfirm} disabled={busy || !area}>
            {busy ? '處理中...' : '確定'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
