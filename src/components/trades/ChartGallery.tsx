"use client";

/* eslint-disable @next/next/no-img-element -- private Firebase chart URLs are intentionally rendered without the public image optimizer */

import { useEffect, useState } from "react";

export function ChartGallery({ images }: { images: readonly string[] }) {
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    if (active == null) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setActive(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [active]);
  if (!images.length) return null;
  return <>
    <section className="review-section chart-gallery"><header><div><span>04</span><h2>Trade charts</h2></div><p>Select an image to view it full screen.</p></header><div className="chart-gallery-grid">{images.map((url, index) => <button key={url} onClick={() => setActive(index)}><img src={url} alt={`Trade chart ${index + 1}`} /><span>View full screen</span></button>)}</div></section>
    {active != null && <div className="chart-lightbox" role="dialog" aria-modal="true" aria-label={`Trade chart ${active + 1}`} onClick={() => setActive(null)}><button aria-label="Close full-screen chart" onClick={() => setActive(null)}>×</button><img src={images[active]} alt={`Trade chart ${active + 1} full screen`} onClick={event => event.stopPropagation()} /></div>}
  </>;
}
