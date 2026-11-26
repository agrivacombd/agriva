"use client";
import OptimizedImage from "@/components/ui/OptimizedImage";

import { useEffect, useRef, useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
  imageAlt: string;
};

export default function ProductImageGallery({ images, productName, imageAlt }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [scale, setScale] = useState(2);
  const activeImage = images[activeIndex] || images[0];
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const preventClickUntilRef = useRef(0);

  function showImage(delta: number) {
    setActiveIndex(current => (current + delta + images.length) % images.length);
    setHovering(false);
    setScale(1);
  }

  function finishSwipe(event: React.TouchEvent<HTMLButtonElement>) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || images.length <= 1 || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      preventClickUntilRef.current = Date.now() + 450;
      showImage(dx < 0 ? 1 : -1);
    }
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    const priorOverflow = document.body.style.overflow;
    const focusReturn = previewButtonRef.current;
    document.body.style.overflow = "hidden";
    lightboxCloseRef.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      else if (images.length > 1 && event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex(current => (current + 1) % images.length);
        setScale(1);
      } else if (images.length > 1 && event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex(current => (current - 1 + images.length) % images.length);
        setScale(1);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = priorOverflow;
      document.removeEventListener("keydown", handleKey);
      focusReturn?.focus();
    };
  }, [lightboxOpen, images.length]);

  function updateOrigin(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({
      x: Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  }

  return (
    <>
      <div className="flex w-full min-w-0 flex-col items-center gap-2 sm:gap-3">
        <div
          className="group relative w-full overflow-hidden rounded-xl border border-slate-100 bg-white"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onMouseMove={updateOrigin}
        >
          <button
            ref={previewButtonRef}
            type="button"
            onClick={() => {
              if (Date.now() < preventClickUntilRef.current) return;
              setHovering(false);
              setScale(1);
              setLightboxOpen(true);
            }}
            onTouchStart={event => {
              if (event.touches.length === 1) touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
            }}
            onTouchEnd={finishSwipe}
            onTouchCancel={() => { touchStartRef.current = null; }}
            aria-label={productName + " ছবিটি বড় করে দেখুন"}
            className="relative block aspect-[4/3] w-full touch-pan-y cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:aspect-square sm:rounded-2xl"
          >
            <OptimizedImage
              src={activeImage}
              alt={imageAlt}
              width={900}
              height={900}
              fetchPriority="high"
              decoding="async"
              draggable={false}
              className="h-full w-full object-contain transition-transform duration-150 ease-out"
              style={hovering ? { transform: "scale(2)", transformOrigin: origin.x + "% " + origin.y + "%" } : undefined}
            />
            <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-emerald-950 shadow-sm sm:bottom-3 sm:right-3 sm:px-3 sm:py-2 sm:text-xs">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5M10.8 7.5v6.6M7.5 10.8h6.6"/></svg>
              বড় করে দেখুন
            </span>
            {images.length > 1 && <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-slate-950/75 px-2.5 py-1.5 text-xs font-bold tabular-nums text-white sm:bottom-3 sm:left-3">{activeIndex + 1} / {images.length}</span>}
          </button>
          {images.length > 1 && (
            <div className="pointer-events-none absolute inset-y-0 left-2 right-2 flex items-center justify-between gap-2">
              <button type="button" onClick={() => showImage(-1)} aria-label="আগের ছবি দেখুন"
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/95 text-xl font-black text-emerald-900 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100">
                ‹
              </button>
              <button type="button" onClick={() => showImage(1)} aria-label="পরের ছবি দেখুন"
                className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white/95 text-xl font-black text-emerald-900 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100">
                ›
              </button>
            </div>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid w-full grid-cols-4 gap-2" aria-label="পণ্যের অন্যান্য ছবি">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => { setActiveIndex(index); setScale(1); setHovering(false); }}
                aria-label={productName + " ছবি " + (index + 1) + " দেখুন"}
                aria-pressed={activeIndex === index}
                className={"h-14 overflow-hidden rounded-lg border-2 bg-white transition sm:h-20 sm:rounded-xl lg:h-24 " + (activeIndex === index ? "border-emerald-700 ring-2 ring-emerald-100" : "border-emerald-900/10 hover:border-emerald-500")}
              >
                <OptimizedImage src={src} alt={productName + " — ছবি " + (index + 1)} loading="lazy" decoding="async" className="h-full w-full bg-white object-contain" />
              </button>
            ))}
          </div>
        )}
        <p className="text-center text-[11px] text-slate-500 sm:text-xs">{images.length > 1 ? "ছবি বদলাতে সোয়াইপ করুন বা তীর চিহ্নে চাপুন। " : ""}ছবি বড় করতে ট্যাপ করুন।</p>
      </div>

      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={productName + " বড় ছবি"}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onClick={() => setLightboxOpen(false)}
          onKeyDown={(event) => { if (event.key === "Escape") setLightboxOpen(false); }}
        >
          <div className="relative flex max-h-full w-full max-w-5xl flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
            <div className="flex w-full items-center justify-between gap-3 text-white">
              <p className="line-clamp-1 text-sm font-bold">{productName}</p>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => setScale((value) => Math.max(1, value - 0.5))} disabled={scale <= 1} aria-label="ছবি ছোট করুন" className="h-10 w-10 rounded-full bg-white/15 text-xl font-bold disabled:opacity-40">−</button>
                <span className="min-w-12 text-center text-xs font-semibold">{Math.round(scale * 100)}%</span>
                <button type="button" onClick={() => setScale((value) => Math.min(4, value + 0.5))} disabled={scale >= 4} aria-label="ছবি বড় করুন" className="h-10 w-10 rounded-full bg-white/15 text-xl font-bold disabled:opacity-40">+</button>
                <button ref={lightboxCloseRef} type="button" onClick={() => setLightboxOpen(false)} aria-label="বন্ধ করুন" className="ml-1 h-10 w-10 rounded-full bg-white text-xl font-bold text-slate-900">×</button>
              </div>
            </div>
            <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-auto rounded-xl">
              <OptimizedImage
                src={activeImage}
                alt={activeIndex === 0 ? imageAlt : productName + " — ছবি " + (activeIndex + 1)}
                className="max-h-[78vh] max-w-full object-contain transition-transform duration-150"
                style={{ transform: "scale(" + scale + ")" }}
              />
              {images.length > 1 && (
                <div className="pointer-events-none absolute inset-x-1 inset-y-0 flex items-center justify-between sm:inset-x-4">
                  <button type="button" aria-label="আগের ছবি দেখুন" onClick={() => showImage(-1)}
                    className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-white/90 text-2xl font-bold text-slate-950 shadow-lg hover:bg-white">‹</button>
                  <button type="button" aria-label="পরের ছবি দেখুন" onClick={() => showImage(1)}
                    className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-white/90 text-2xl font-bold text-slate-950 shadow-lg hover:bg-white">›</button>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex max-w-full gap-2 overflow-x-auto py-1" aria-label={"ছবি " + (activeIndex + 1) + " / " + images.length}>
                {images.map((src, index) => (
                  <button key={src} type="button" onClick={() => { setActiveIndex(index); setScale(1); setHovering(false); }} aria-label={"ছবি " + (index + 1)} aria-pressed={activeIndex === index} className={"h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 " + (activeIndex === index ? "border-lime-300" : "border-white/30")}>
                    <OptimizedImage src={src} alt="" className="h-full w-full bg-white object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
