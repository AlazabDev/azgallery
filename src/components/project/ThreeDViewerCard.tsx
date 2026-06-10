interface ThreeDViewerCardProps {
  src?: string;
  title?: string;
}

const DEFAULT_VIEWER_URL =
  "https://3d.magicplan.app/#embed/?key=OWY4NTMxODc2NGJhMjA1MzlmNzc5NThmOTM2MTA3MDg3ODdjYmI4Y2QxZWMxMWMzZWVmYTE3MjRlNTM2NDdiNUOFXNR9vQaH%2FUjVv9jkjkX8pIA1i%2Br5XI5JElCn0LlkvhpDuYrczKGi29H%2B3uKrHYaHs4IFaXm%2FR6G2c4uJSK8Ypel%2BHlhFbX447CSO9SNS";

export function ThreeDViewerCard({
  src = DEFAULT_VIEWER_URL,
  title = "المخطط ثلاثي الأبعاد",
}: ThreeDViewerCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </header>

      <iframe
        src={src}
        title={title}
        className="block min-h-[620px] w-full border-0"
        allow="fullscreen"
        allowFullScreen
      />
    </section>
  );
}
