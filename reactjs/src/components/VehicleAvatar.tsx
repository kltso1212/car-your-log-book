import { useCallback, useEffect, useMemo, useState } from 'react';
import { getImages, imageFileUrl } from '../services/api';
import type { ImageInfo } from '../services/api';
import { useImageViewer } from '../contexts/ImageViewerContext';

// Profile-picture style avatar for the selected vehicle: circular image,
// clicking opens the full picture in the global lightbox. Crop / upload /
// delete live in the vehicle dialog (✏️ in the identity bar). The uncropped
// original kept server-side as avatar_source still allows re-cropping there.
// `refreshToken` lets a parent (identity bar) force a re-fetch after the
// vehicle dialog changed the image.
export default function VehicleAvatar({
  vehicleId,
  refreshToken,
}: {
  vehicleId: number;
  refreshToken?: number | undefined;
}) {
  const { viewImage } = useImageViewer();
  const [avatar, setAvatar] = useState<ImageInfo | null>(null);
  const [source, setSource] = useState<ImageInfo | null>(null);

  const refresh = useCallback(() => {
    getImages('vehicle', [vehicleId])
      .then(res => {
        setAvatar(res.data.find(i => i.kind === 'avatar') ?? null);
        setSource(res.data.find(i => i.kind === 'avatar_source') ?? null);
      })
      .catch(() => {
        setAvatar(null);
        setSource(null);
      });
  }, [vehicleId]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshToken]);

  const fullUrl = useMemo(() => {
    if (source) return imageFileUrl(source.id);
    if (avatar) return imageFileUrl(avatar.id);
    return null;
  }, [source, avatar]);

  if (!fullUrl) {
    return (
      <div className="avatar-wrap">
        <div className="avatar-circle avatar-placeholder" aria-hidden="true">
          🚗
        </div>
      </div>
    );
  }

  return (
    <div className="avatar-wrap">
      <button
        type="button"
        className="avatar-circle"
        title="查看座駕圖片"
        aria-label="查看座駕圖片"
        onClick={() => viewImage(fullUrl, '座駕圖片')}
      >
        <img src={fullUrl} alt="" />
      </button>
    </div>
  );
}
