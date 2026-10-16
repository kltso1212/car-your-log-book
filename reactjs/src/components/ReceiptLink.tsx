import { imageFileUrl } from '../services/api';
import type { ImageInfo } from '../services/api';
import { useImageViewer } from '../contexts/ImageViewerContext';

// Shared receipt action used by every record table and card list: shows the
// 🔗 button for a record's receipt and opens it in the global lightbox.
// Renders nothing when the record has no receipt image.
export default function ReceiptLink({
  receipt,
  label,
}: {
  receipt: ImageInfo | null | undefined;
  label: string;
}) {
  const { viewImage } = useImageViewer();

  if (!receipt) return null;

  return (
    <button
      className="icon-button"
      title="查看收據"
      aria-label={`查看 ${label} 收據`}
      onClick={() => viewImage(imageFileUrl(receipt.id), '收據圖片')}>
      🔗
    </button>
  );
}
