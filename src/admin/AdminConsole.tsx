import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApi } from './admin-api';
import type { AdminComment, AdminImage, AdminProject } from './types';

interface Props { onExit: () => void }
const STORE_KEY = 'azgallery_admin_key';

export function AdminConsole({ onExit }: Props) {
  const [adminKey, setAdminKey] = useState(sessionStorage.getItem(STORE_KEY) ?? '');
  const [candidateKey, setCandidateKey] = useState(adminKey);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [images, setImages] = useState<AdminImage[]>([]);
  const [tab, setTab] = useState<'projects' | 'reviews'>('projects');
  const [error, setError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  async function load(key = adminKey) {
    if (!key) return;
    setError(null);
    try {
      const [{ projects }, { comments }] = await Promise.all([adminApi.listProjects(key), adminApi.listComments(key)]);
      setProjects(projects); setComments(comments);
      const slug = selectedSlug || projects[0]?.slug || '';
      setSelectedSlug(slug);
      if (slug) setImages((await adminApi.listImages(key, slug)).images);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل لوحة الإدارة.'); }
  }

  useEffect(() => { void load(); }, [adminKey]);
  useEffect(() => { if (adminKey && selectedSlug) adminApi.listImages(adminKey, selectedSlug).then(({ images }) => setImages(images)).catch((err: Error) => setError(err.message)); }, [adminKey, selectedSlug]);

  function signIn(event: FormEvent) {
    event.preventDefault(); sessionStorage.setItem(STORE_KEY, candidateKey); setAdminKey(candidateKey);
  }
  function signOut() { sessionStorage.removeItem(STORE_KEY); setAdminKey(''); setCandidateKey(''); setProjects([]); setComments([]); }

  const openComments = useMemo(() => comments.filter((comment) => comment.status === 'open'), [comments]);
  const activeProjects = useMemo(() => projects.filter((project) => project.status === 'active'), [projects]);

  if (!adminKey) return (
    <main className="admin-login">
      <form onSubmit={signIn}><p>AzGallery</p><h1>لوحة الإدارة</h1><span>أدخل مفتاح الإدارة لفتح أدوات إدارة المشروعات والملاحظات.</span><input value={candidateKey} onChange={(event) => setCandidateKey(event.target.value)} type="password" required placeholder="AZGALLERY_ADMIN_KEY" /><button className="button button--primary" type="submit">فتح اللوحة</button><button className="text-button" type="button" onClick={onExit}>العودة إلى المعرض</button></form>
    </main>
  );

  return (
    <main className="admin-shell">
      <header className="admin-header"><div><p>AzGallery</p><h1>إدارة معرض المشروعات</h1></div><div><button className="button button--outline" type="button" onClick={() => void load()}>تحديث البيانات</button><button className="button button--outline" type="button" onClick={onExit}>واجهة العميل</button><button className="button button--danger" type="button" onClick={signOut}>خروج</button></div></header>
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-stats"><article><strong>{activeProjects.length}</strong><span>مشروع نشط</span></article><article><strong>{projects.length}</strong><span>إجمالي المشروعات</span></article><article><strong>{openComments.length}</strong><span>ملاحظة مفتوحة</span></article><article><strong>{images.length}</strong><span>صور المشروع المحدد</span></article></section>
      <nav className="admin-tabs"><button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')} type="button">المشروعات والصور</button><button className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')} type="button">مراجعات العملاء</button></nav>
      {tab === 'projects' ? <ProjectsSection adminKey={adminKey} projects={projects} selectedSlug={selectedSlug} setSelectedSlug={setSelectedSlug} images={images} reload={() => void load()} setCreatedToken={setCreatedToken} /> : <ReviewsSection adminKey={adminKey} comments={comments} reload={() => void load()} />}
      {createdToken && <aside className="token-box"><strong>رابط المشاركة الخاص بالمشروع</strong><code>{createdToken}</code><button type="button" onClick={() => navigator.clipboard.writeText(createdToken)}>نسخ الرابط</button><button type="button" onClick={() => setCreatedToken(null)}>إغلاق</button></aside>}
    </main>
  );
}

function ProjectsSection({ adminKey, projects, selectedSlug, setSelectedSlug, images, reload, setCreatedToken }: { adminKey: string; projects: AdminProject[]; selectedSlug: string; setSelectedSlug: (slug: string) => void; images: AdminImage[]; reload: () => void; setCreatedToken: (token: string | null) => void }) {
  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const { project, accessToken } = await adminApi.createProject(adminKey, { slug: String(form.get('slug')), title: String(form.get('title')), subtitle: String(form.get('subtitle') || '') || undefined, location: String(form.get('location') || '') || undefined, coverImageUrl: String(form.get('coverImageUrl')), isPublic: form.get('isPublic') === 'on' });
    if (accessToken) setCreatedToken(`${window.location.origin}/?project=${encodeURIComponent(project.slug)}&access=${encodeURIComponent(accessToken)}`);
    event.currentTarget.reset(); reload();
  }
  async function addImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedSlug) return; const form = new FormData(event.currentTarget);
    await adminApi.addImage(adminKey, selectedSlug, { title: String(form.get('title') || '') || undefined, imageUrl: String(form.get('imageUrl')), thumbnailUrl: String(form.get('thumbnailUrl')), displayOrder: Number(form.get('displayOrder') || 0) }); event.currentTarget.reset(); reload();
  }
  return <section className="admin-grid">
    <article className="admin-panel"><h2>إنشاء بطاقة مشروع</h2><form className="admin-form" onSubmit={(event) => void createProject(event)}><input name="slug" required placeholder="slug مثال: villa-new-cairo" /><input name="title" required placeholder="اسم المشروع" /><input name="subtitle" placeholder="وصف مختصر" /><input name="location" placeholder="الموقع" /><input name="coverImageUrl" required placeholder="/media/projects/.../cover.jpg" /><label><input name="isPublic" type="checkbox" defaultChecked /> مشروع عام يظهر في البطاقات</label><button className="button button--primary" type="submit">إنشاء المشروع</button></form></article>
    <article className="admin-panel"><h2>المشروعات الحالية</h2><div className="admin-list">{projects.map((project) => <article key={project.id} className={selectedSlug === project.slug ? 'admin-list__item active' : 'admin-list__item'}><button className="admin-list__select" type="button" onClick={() => setSelectedSlug(project.slug)}><span><strong>{project.title}</strong><small>{project.slug}</small></span><em>{project.status === 'active' ? 'نشط' : 'مؤرشف'}</em></button><button className="button button--outline" type="button" onClick={() => void adminApi.setProjectStatus(adminKey, project.slug, project.status === 'active' ? 'archived' : 'active').then(reload)}>{project.status === 'active' ? 'أرشفة' : 'تفعيل'}</button></article>)}</div></article>
    <article className="admin-panel admin-panel--wide"><h2>صور المشروع المحدد</h2>{selectedSlug ? <><form className="admin-form admin-form--inline" onSubmit={(event) => void addImage(event)}><input name="title" placeholder="عنوان الصورة" /><input name="imageUrl" required placeholder="/media/projects/.../image.jpg" /><input name="thumbnailUrl" required placeholder="/media/projects/.../thumb.jpg" /><input name="displayOrder" type="number" min="0" defaultValue="0" /><button className="button button--primary" type="submit">إضافة الصورة</button></form><div className="images-table">{images.map((image) => <article key={image.id}><span><strong>{image.title ?? 'صورة بلا عنوان'}</strong><small>{image.imageUrl}</small></span><input type="number" min="0" defaultValue={image.displayOrder} onBlur={(event) => void adminApi.setImageOrder(adminKey, image.id, Number(event.target.value)).then(reload)} /><button className="button button--outline" type="button" onClick={() => void adminApi.setImageStatus(adminKey, image.id, image.status === 'active' ? 'archived' : 'active').then(reload)}>{image.status === 'active' ? 'أرشفة' : 'تفعيل'}</button></article>)}</div></> : <p>أنشئ مشروعًا أو اختر مشروعًا موجودًا.</p>}</article>
  </section>;
}

function ReviewsSection({ adminKey, comments, reload }: { adminKey: string; comments: AdminComment[]; reload: () => void }) {
  return <section className="admin-panel"><h2>مراجعات العملاء</h2><div className="reviews-table">{comments.map((comment) => <article key={comment.id}><div><strong>{comment.projectTitle}</strong><small>{comment.imageTitle ?? 'صورة بلا عنوان'} · {comment.guestName}</small><p>{comment.body}</p></div><button className={comment.status === 'open' ? 'button button--resolve' : 'button button--outline'} type="button" onClick={() => void adminApi.setCommentStatus(adminKey, comment.id, comment.status === 'open' ? 'resolved' : 'open').then(reload)}>{comment.status === 'open' ? 'تم التنفيذ' : 'إعادة الفتح'}</button></article>)}</div></section>;
}
