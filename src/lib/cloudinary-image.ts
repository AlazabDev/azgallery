/**
 * Cloudinary responsive image helpers.
 * Injects transformations into any Cloudinary "/upload/" URL to:
 *   - auto-select the best format (WebP/AVIF) via f_auto
 *   - auto-compress with q_auto
 *   - resize/crop for the target width
 * Generates srcSet for responsive delivery across devices.
 * Non-Cloudinary URLs are returned as-is.
 */

const MARKER = "/upload/";

export function isCloudinaryUrl(url: string | null | undefined): boolean {
  return !!url && url.includes("res.cloudinary.com") && url.includes(MARKER);
}

export function cldTransform(url: string | null | undefined, transform: string): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;
  return url.replace(MARKER, `${MARKER}${transform}/`);
}

/** Sizes tuned for common device breakpoints. */
export const RESPONSIVE_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1600, 1920] as const;
export const THUMB_WIDTHS = [160, 240, 360, 480] as const;

type Mode = "limit" | "fill";

function buildTransform(width: number, mode: Mode, height?: number) {
  const crop = mode === "fill" ? "c_fill,g_auto" : "c_limit";
  const h = height ? `,h_${height}` : "";
  return `f_auto,q_auto,${crop},w_${width}${h},dpr_auto`;
}

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  sizes: string;
}

/** Large display image (main viewer, lightbox). */
export function responsiveImage(
  url: string | null | undefined,
  opts: { sizes?: string; widths?: readonly number[] } = {},
): ResponsiveImage {
  const widths = opts.widths ?? RESPONSIVE_WIDTHS;
  const sizes = opts.sizes ?? "(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px";
  if (!url || !isCloudinaryUrl(url)) {
    return { src: url ?? "", srcSet: "", sizes };
  }
  const srcSet = widths
    .map((w) => `${cldTransform(url, buildTransform(w, "limit"))} ${w}w`)
    .join(", ");
  const src = cldTransform(url, buildTransform(widths[Math.floor(widths.length / 2)], "limit"));
  return { src, srcSet, sizes };
}

/** Square thumbnail (grid/strip). */
export function responsiveThumbnail(
  url: string | null | undefined,
  opts: { size?: number; sizes?: string; widths?: readonly number[] } = {},
): ResponsiveImage {
  const size = opts.size ?? 240;
  const widths = opts.widths ?? THUMB_WIDTHS;
  const sizes = opts.sizes ?? `${size}px`;
  if (!url || !isCloudinaryUrl(url)) {
    return { src: url ?? "", srcSet: "", sizes };
  }
  const srcSet = widths
    .map((w) => `${cldTransform(url, buildTransform(w, "fill", w))} ${w}w`)
    .join(", ");
  const src = cldTransform(url, buildTransform(size, "fill", size));
  return { src, srcSet, sizes };
}

/** LQIP placeholder (tiny blurred). */
export function lqipUrl(url: string | null | undefined): string {
  return cldTransform(url, "f_auto,q_auto:low,w_32,e_blur:400");
}
