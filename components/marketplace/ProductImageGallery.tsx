"use client";

import { useState } from "react";

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
  const activeImage = images[activeIndex];

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
            type="button"
            onClick={() => { setScale(2); setLightboxOpen(true); }}
            aria-label={productName + " ছবিটি বড় করে দেখুন"}
            className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 sm:aspect-square sm:rounded-2xl"
          >
            <img
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
          </button>
        </div>
        {images.length > 1 && (
          <div className="grid w-full grid-cols-4 gap-2" aria-label="পণ্যের অন্যান্য ছবি">
            {images.map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={productName + " ছবি " + (index + 1) + " দেখুন"}
                aria-pressed={activeIndex === index}
                className={"h-14 overflow-hidden rounded-lg border-2 bg-white transition sm:h-20 sm:rounded-xl lg:h-24 " + (activeIndex === index ? "border-emerald-700 ring-2 ring-emerald-100" : "border-emerald-900/10 hover:border-emerald-500")}
              >
                <img src={src} alt={productName + " — ছবি " + (index + 1)} loading="lazy" decoding="async" className="h-full w-full bg-white object-contain" />
              </button>
            ))}
          </div>
        )}
        <p className="hidden text-xs text-slate-500 sm:block">ছবির ওপর মাউস রাখুন বা ট্যাপ করে জুম করুন</p>
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
                <button type="button" onClick={() => setLightboxOpen(false)} aria-label="বন্ধ করুন" className="ml-1 h-10 w-10 rounded-full bg-white text-xl font-bold text-slate-900">×</button>
              </div>
            </div>
            <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-auto rounded-xl">
              <img
                src={activeImage}
                alt={imageAlt}
                className="max-h-[78vh] max-w-full object-contain transition-transform duration-150"
                style={{ transform: "scale(" + scale + ")" }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex max-w-full gap-2 overflow-x-auto py-1">
                {images.map((src, index) => (
                  <button key={src} type="button" onClick={() => setActiveIndex(index)} aria-label={"ছবি " + (index + 1)} aria-pressed={activeIndex === index} className={"h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 " + (activeIndex === index ? "border-lime-300" : "border-white/30")}>
                    <img src={src} alt="" className="h-full w-full bg-white object-contain" />
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
