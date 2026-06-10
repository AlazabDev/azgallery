export interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
}

interface AttachmentsCardProps {
  attachments?: ProjectAttachment[];
}

export function AttachmentsCard({
  attachments = [],
}: AttachmentsCardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">
          المرفقات
        </h2>
      </header>

      <div className="p-4">
        {attachments.length === 0 ? (
          <p className="text-sm text-slate-500">
            لا توجد مرفقات متاحة حاليًا.
          </p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li key={attachment.id}>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  {attachment.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
