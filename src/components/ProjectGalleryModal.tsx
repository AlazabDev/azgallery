import { MouseEvent, useEffect, useMemo, useState } from 'react';
import type { GalleryComment, GalleryImage, ProjectCard } from '../types/gallery';
import { api } from '../lib/api';
import { getGuestSession } from '../lib/session';
import { CommentPanel } from './CommentPanel';
import { FullscreenLightbox } from './FullscreenLightbox';
import { ImageWithFallback } from './ImageWithFallback';

interface PendingPin { xRatio: number; yRatio: number }
interface Props { project: ProjectCard; onClose: () => void }

export function ProjectGalleryModal({ project, onClose }: Props) {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access') ?? undefined;
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [comments, setComments] = useState<GalleryComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [lightboxSignal, setLightboxSignal] = useState(0);
  const activeImage = images[activeIndex];

  useEffect(() => { document.body.classList.add('modal-open'); return () => document.body.classList.remove('modal-open'); }, []);
  useEffect(() => {
    setPageLoading(true); setError(null);
    api.listImages(project.slug, accessToken).then(({ images }) => { setImages(images); setActiveIndex(0); }).catch((err: Error) => setError(err.message)).finally(() => setPageLoading(false));
  }, [project.slug, accessToken]);
  useEffect(() => {
    if (!activeImage) return;
    setPendingPin(null); setPinMode(false);
    api.listComments(activeImage.id, project.slug, accessToken).then(({ comments }) => setComments(comments)).catch((err: Error) => setError(err.message));
  }, [activeImage?.id, project.slug, accessToken]);

  const commentPins = useMemo(() => comments.filter((comment) => comment.commentType === 'pin'), [comments]);
  function move(step: number) { if (images.length) setActiveIndex((current) => (current + step + images.length) % images.length); }
  function placePin(event: MouseEvent<HTMLDivElement>) {
    if (!pinMode) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPendingPin({ xRatio: Number(((event.clientX - rect.left) / rect.width).toFixed(6)), yRatio: Number(((event.clientY - rect.top) / rect.height).toFixed(6)) });
    setPinMode(false);
  }
  async function addComment(values: { guestName: string; guestPhone?: string; body: string }) {
    if (!activeImage) return;
    setLoading(true); setError(null);
    try {
      const { comment } = await api.addComment(activeImage.id, { projectSlug: project.slug, accessToken, guestSession: getGuestSession(), ...values, ...(pendingPin ?? {}) });
      setComments((current) => [...current, comment]); setPendingPin(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر إرسال الملاحظة.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="gallery-modal" role="dialog" aria-modal="true" aria-label={`معرض ${project.title}`}>
      <header className="gallery-modal__topbar"><div><p>AzGallery</p><h2>{project.title}</h2></div><div className="gallery-modal__actions"><button className="button button--outline-light" type="button" onClick={() => setLightboxSignal((value) => value + 1)} disabled={!activeImage}>عرض ملء الشاشة</button><button className="close-button" type="button" onClick={onClose} aria-label="إغلاق">×</button></div></header>
      {pageLoading ? <div className="full-message">جارٍ تحميل صور المشروع...</div> : error && images.length === 0 ? <div className="full-message">{error}</div> : (
        <div className="gallery-layout">
          <main className="viewer-area">
            {activeImage ? <>
              <div className={pinMode ? 'image-stage image-stage--pin-mode' : 'image-stage'}>
                <div className="image-canvas" onClick={placePin}>
                  <ImageWithFallback src={activeImage.imageUrl} alt={activeImage.title ?? project.title} />
                  {commentPins.map((comment, index) => comment.xRatio !== null && comment.yRatio !== null && <button className="annotation-pin" style={{ left: `${comment.xRatio * 100}%`, top: `${comment.yRatio * 100}%` }} key={comment.id} title={comment.body}>{index + 1}</button>)}
                  {pendingPin && <span className="annotation-pin annotation-pin--pending" style={{ left: `${pendingPin.xRatio * 100}%`, top: `${pendingPin.yRatio * 100}%` }}>+</span>}
                </div>
              </div>
              <div className="viewer-meta"><button type="button" onClick={() => move(-1)} aria-label="الصورة السابقة">‹</button><div><strong>{activeImage.title ?? `صورة ${activeIndex + 1}`}</strong><span>{activeIndex + 1} / {images.length}</span></div><button type="button" onClick={() => move(1)} aria-label="الصورة التالية">›</button></div>
              <div className="thumbnail-strip">{images.map((image, index) => <button className={index === activeIndex ? 'thumbnail thumbnail--active' : 'thumbnail'} type="button" key={image.id} onClick={() => setActiveIndex(index)}><ImageWithFallback src={image.thumbnailUrl} alt={image.title ?? `صورة ${index + 1}`} loading="lazy" />{image.commentCount > 0 && <span>{image.commentCount}</span>}</button>)}</div>
            </> : <div className="full-message">لا توجد صور داخل هذا المشروع.</div>}
          </main>
          <CommentPanel comments={comments} pendingPin={pendingPin} isPinMode={pinMode} loading={loading} error={error} onTogglePinMode={() => setPinMode((value) => !value)} onCancelPin={() => setPendingPin(null)} onSubmit={addComment} />
        </div>
      )}
      <FullscreenLightbox images={images} activeIndex={activeIndex} openSignal={lightboxSignal} />
    </div>
  );
}
