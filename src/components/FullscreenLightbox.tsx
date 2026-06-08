import { useEffect, useRef } from 'react';
import lightGallery from 'lightgallery';
import type { LightGallery } from 'lightgallery/lightgallery';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgZoom from 'lightgallery/plugins/zoom';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-zoom.css';
import type { GalleryImage } from '../types/gallery';

interface Props { images: GalleryImage[]; activeIndex: number; openSignal: number }

export function FullscreenLightbox({ images, activeIndex, openSignal }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<LightGallery | null>(null);

  useEffect(() => {
    if (!host.current) return;
    instance.current = lightGallery(host.current, {
      dynamic: true,
      dynamicEl: images.map((image) => ({ src: image.imageUrl, thumb: image.thumbnailUrl, subHtml: image.description ?? image.title ?? '' })),
      plugins: [lgThumbnail, lgZoom],
      licenseKey: import.meta.env.VITE_LIGHTGALLERY_LICENSE_KEY || '0000-0000-000-0000',
      speed: 400,
      download: false
    });
    return () => { instance.current?.destroy(); instance.current = null; };
  }, [images]);

  useEffect(() => {
    if (openSignal > 0 && images.length > 0) instance.current?.openGallery(activeIndex);
  }, [openSignal, activeIndex, images.length]);

  return <div ref={host} className="lightbox-host" aria-hidden="true" />;
}
