import Image, { type ImageProps } from "next/image";

type OptimizedImageProps = Omit<ImageProps, "width" | "height"> & {
  width?: number;
  height?: number;
};

/**
 * Shared image boundary for user-provided media. Supabase public storage images
 * use the Next.js optimizer; local previews (blob/data URLs) and untrusted
 * third-party hosts remain direct to avoid remote-host and SSRF surprises.
 */
export default function OptimizedImage({
  src,
  width = 1200,
  height = 800,
  sizes = "(max-width: 768px) 100vw, 50vw",
  unoptimized,
  alt,
  ...props
}: OptimizedImageProps) {
  const source = typeof src === "string" ? src : "";
  const isLocalPreview = source.startsWith("blob:") || source.startsWith("data:");
  const isRelative = source.startsWith("/");
  const isTrustedRemote = /^https:\/\/[^/]+\.supabase\.co\//i.test(source)
    || /^https:\/\/agriva\.com\.bd\//i.test(source);

  return (
    <Image
      {...props}
      alt={alt}
      src={src}
      width={width}
      height={height}
      sizes={sizes}
      unoptimized={unoptimized ?? (isLocalPreview || (!isRelative && !isTrustedRemote))}
    />
  );
}
