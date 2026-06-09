import { FormEvent, useMemo, useState } from 'react';
import type { GalleryComment } from '../types/gallery';

interface PendingPin { xRatio: number; yRatio: number }
interface Props {
  comments: GalleryComment[];
  pendingPin: PendingPin | null;
  isPinMode: boolean;
  loading: boolean;
  error: string | null;
  onTogglePinMode: () => void;
  onCancelPin: () => void;
  onSubmit: (values: { guestName: string; guestPhone?: string; body: string }) => Promise<void>;
}

export function CommentPanel({ comments, pendingPin, isPinMode, loading, error, onTogglePinMode, onCancelPin, onSubmit }: Props) {
  const [guestName, setGuestName] = useState(localStorage.getItem('azgallery_guest_name') ?? '');
  const [guestPhone, setGuestPhone] = useState(localStorage.getItem('azgallery_guest_phone') ?? '');
  const [body, setBody] = useState('');
  const openCount = useMemo(() => comments.filter((comment) => comment.status === 'open').length, [comments]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guestName.trim().length < 2 || body.trim().length < 3) return;
    await onSubmit({ guestName: guestName.trim(), guestPhone: guestPhone.trim() || undefined, body: body.trim() });
    localStorage.setItem('azgallery_guest_name', guestName.trim());
    localStorage.setItem('azgallery_guest_phone', guestPhone.trim());
    setBody('');
  }

  return (
    <aside className="comment-panel">
      <header className="comment-panel__header">
        <div><p>مراجعة الصورة الحالية</p><h3>{openCount} ملاحظة مفتوحة</h3></div>
        <button className={isPinMode ? 'button button--active' : 'button button--outline'} type="button" onClick={onTogglePinMode}>
          {isPinMode ? 'انقر على موضع بالصورة' : 'تحديد موضع بالصورة'}
        </button>
      </header>
      {pendingPin && <div className="pending-pin"><strong>تم تحديد نقطة جديدة.</strong><span>اكتب الملاحظة ثم اضغط إرسال.</span><button type="button" onClick={onCancelPin}>إلغاء النقطة</button></div>}
      <div className="comment-list">
        {comments.length === 0 ? <div className="empty-state">لا توجد ملاحظات على هذه الصورة حتى الآن.</div> : comments.map((comment, index) => (
          <article className="comment-item" key={comment.id}>
            <div className="comment-item__top"><strong>{comment.guestName}</strong><span>{comment.commentType === 'pin' ? `نقطة ${index + 1}` : 'تعليق نصي'}</span></div>
            <p>{comment.body}</p>
            <footer><time>{new Date(comment.createdAt).toLocaleString('ar-EG')}</time><em className={comment.status === 'resolved' ? 'status status--resolved' : 'status'}>{comment.status === 'resolved' ? 'تم الحل' : 'مفتوحة'}</em></footer>
          </article>
        ))}
      </div>
      <form className="comment-form" onSubmit={submit}>
        <h4>إضافة ملاحظة</h4>
        <div className="form-row"><input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="الاسم" required minLength={2} maxLength={80} /><input value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} placeholder="رقم الهاتف — اختياري" maxLength={30} /></div>
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="اكتب الملاحظة بوضوح..." required minLength={3} maxLength={1000} rows={4} />
        {error && <p className="form-error">{error}</p>}
        <button className="button button--primary" type="submit" disabled={loading}>{loading ? 'جارٍ الإرسال...' : pendingPin ? 'إرسال الملاحظة على النقطة' : 'إرسال الملاحظة النصية'}</button>
      </form>
    </aside>
  );
}
