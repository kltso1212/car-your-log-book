import { createContext, useContext } from 'react';

export interface ImageViewerApi {
  viewImage: (url: string, alt?: string) => void;
}

export const ImageViewerContext = createContext<ImageViewerApi>({
  viewImage: () => {},
});

export const useImageViewer = () => useContext(ImageViewerContext);
