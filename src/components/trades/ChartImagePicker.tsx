"use client";

/* eslint-disable @next/next/no-img-element -- local blob previews and private Firebase URLs cannot use the Next image optimizer */

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { MAX_CHART_BYTES, MAX_CHART_IMAGES } from "@/lib/firebase/storage";

type Props = {
  existingImages: readonly string[];
  files: readonly File[];
  onFilesChange: (files: File[]) => void;
  onRemoveExisting: (url: string) => void;
};

export function ChartImagePicker({ existingImages, files, onFilesChange, onRemoveExisting }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const previews = useMemo(() => files.map(file => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach(preview => URL.revokeObjectURL(preview.url)), [previews]);

  function select(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (existingImages.length + files.length + selected.length > MAX_CHART_IMAGES) {
      setError("You can attach up to three chart images.");
      return;
    }
    if (selected.some(file => !file.type.startsWith("image/"))) {
      setError("Choose image files only.");
      return;
    }
    if (selected.some(file => file.size > MAX_CHART_BYTES)) {
      setError("Each image must be 8 MB or smaller.");
      return;
    }
    setError("");
    onFilesChange([...files, ...selected]);
  }

  const count = existingImages.length + files.length;
  return <div className="chart-picker">
    <div className="chart-picker-heading"><div><b>Chart screenshots</b><span>Attach up to 3 images, 8 MB each.</span></div><span>{count}/{MAX_CHART_IMAGES}</span></div>
    {count > 0 && <div className="chart-preview-grid">
      {existingImages.map((url, index) => <figure key={url}><img src={url} alt={`Saved chart ${index + 1}`} /><button type="button" aria-label={`Remove saved chart ${index + 1}`} onClick={() => onRemoveExisting(url)}>×</button></figure>)}
      {previews.map(({ file, url }, index) => <figure key={`${file.name}-${file.lastModified}`}><img src={url} alt={`New chart ${index + 1}`} /><button type="button" aria-label={`Remove new chart ${index + 1}`} onClick={() => onFilesChange(files.filter(candidate => candidate !== file))}>×</button></figure>)}
    </div>}
    {count < MAX_CHART_IMAGES && <><input ref={inputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={select} /><button type="button" className="chart-upload-button" onClick={() => inputRef.current?.click()}>＋ Choose chart images</button></>}
    {error && <span className="field-error" role="alert">{error}</span>}
  </div>;
}
