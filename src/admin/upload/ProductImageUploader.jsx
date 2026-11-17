import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCEPT_ATTR,
  MAX_BYTES,
  formatBytes,
  saveInBrowser,
  uploadToServer,
  validateImage,
} from "./uploadClient";
import "./ProductImageUploader.css";

/*
  3D product-image uploader.

  value          current image URL stored on the product (form.image)
  onChange(url)  called with the real URL when an upload succeeds, "" on remove
  onBusyChange   (bool) lets the parent block "Save" while an upload is running

  Visual model (pure CSS 3D, no WebGL):
    back orbit  ──  product card (turntable)  ──  front orbit
  The two orbit layers contain identical rings clipped to the upper / lower half
  of a tilted plane, so the glowing arc really passes behind and in front of the
  card. The tilted progress ring is driven by --kfu-p = real bytes sent / total.
*/

const RINGS = (
  <div className="kfu-plane">
    <i className="kfu-ring kfu-ring--ticks" />
    <i className="kfu-ring kfu-ring--track" />
    <i className="kfu-ring kfu-ring--fill" />
    <i className="kfu-ring kfu-ring--comet" />
    <i className="kfu-ring kfu-ring--scan" />
    <i className="kfu-ring kfu-ring--burst" />
  </div>
);

const SPARKS = Array.from({ length: 10 }, (_, index) => index);

export default function ProductImageUploader({ value = "", onChange, onBusyChange, label = "Product image" }) {
  const [phase, setPhase] = useState("idle"); // idle | uploading | done | error
  const [mode, setMode] = useState("server"); // server | browser
  const [progress, setProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState(null); // { name, size }
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const [brokenSrc, setBrokenSrc] = useState("");

  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const previewRef = useRef("");
  const fileRef = useRef(null);
  const dragDepth = useRef(0);

  const displayImage = preview || value;
  const hasImage = Boolean(displayImage);
  const broken = hasImage && brokenSrc === displayImage;
  const uploading = phase === "uploading";

  let status = "idle";
  if (uploading) status = "uploading";
  else if (phase === "error") status = "error";
  else if (phase === "done") status = "done";
  else if (hasImage) status = "ready";
  const visualStatus = dragging && !uploading ? "drag" : status;

  // Let the parent disable "Save product" while bytes are in flight.
  useEffect(() => {
    onBusyChange?.(uploading);
  }, [uploading, onBusyChange]);
  useEffect(() => () => onBusyChange?.(false), [onBusyChange]);

  // Cancel in-flight work and free the preview object URL on unmount.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  const swapPreview = useCallback((next) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreview(next);
  }, []);

  const run = useCallback(
    async (file, transport) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setMode(transport === saveInBrowser ? "browser" : "server");
      setProgress(0);
      setError("");
      setNotice("");
      setPhase("uploading");

      try {
        const { url } = await transport(file, { signal: controller.signal, onProgress: setProgress });
        if (controller.signal.aborted) return;
        setProgress(1);
        setPhase("done");
        onChange?.(url);
      } catch (failure) {
        if (failure?.name === "AbortError") return;
        setError(failure?.message || "The upload failed.");
        setPhase("error");
      }
    },
    [onChange]
  );

  const accept = useCallback(
    (file) => {
      const problem = validateImage(file);
      if (problem) {
        setNotice(problem);
        return;
      }
      fileRef.current = file;
      setFileInfo({ name: file.name, size: file.size });
      swapPreview(URL.createObjectURL(file));
      run(file, uploadToServer);
    },
    [run, swapPreview]
  );

  const onPick = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (file) accept(file);
  };

  const openPicker = () => {
    if (!uploading) inputRef.current?.click();
  };

  const cancel = () => {
    abortRef.current?.abort();
    setPhase("idle");
    setProgress(0);
    swapPreview("");
    setFileInfo(null);
  };

  const remove = () => {
    abortRef.current?.abort();
    setPhase("idle");
    setProgress(0);
    setError("");
    setNotice("");
    swapPreview("");
    setFileInfo(null);
    fileRef.current = null;
    onChange?.("");
  };

  /* drag & drop (depth counter because dragenter/leave fire for every child) */
  const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes("Files");
  const onDragEnter = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragOver = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = uploading ? "none" : "copy";
  };
  const onDragLeave = (event) => {
    if (!hasFiles(event)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (event) => {
    if (!hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (uploading) {
      setNotice("Please wait for the current upload to finish, or cancel it first.");
      return;
    }
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length > 1) setNotice("Only one image can be added — using the first file.");
    if (files[0]) accept(files[0]);
  };

  const onStageKey = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const percent = Math.round(progress * 100);
  const finishing = uploading && progress >= 1;

  let headline;
  let detail = "";
  if (visualStatus === "drag") {
    headline = "Release to upload";
  } else if (uploading) {
    headline = finishing ? "Finishing on the server…" : `${mode === "browser" ? "Preparing" : "Uploading"} · ${percent}%`;
    detail = fileInfo ? `${fileInfo.name} · ${formatBytes(fileInfo.size)}` : "";
  } else if (status === "done") {
    headline = mode === "browser" ? "Saved in this browser" : "Uploaded successfully";
    detail =
      mode === "browser"
        ? "Resized and stored with the product here. Start the Spring Boot server to upload to it."
        : fileInfo
        ? `${fileInfo.name} · ${formatBytes(fileInfo.size)}`
        : "";
  } else if (status === "error") {
    headline = "Upload didn’t finish";
    detail = error;
  } else if (status === "ready") {
    headline = "Current image";
    detail = "Replace it or remove it. Changes apply when you save the product.";
  } else {
    headline = "Drop your product image";
    detail = `or click to browse · JPG, PNG, WEBP, AVIF, GIF · up to ${formatBytes(MAX_BYTES)}`;
  }

  return (
    <div
      className="kfu"
      data-status={visualStatus}
      style={{ "--kfu-p": status === "ready" ? 1 : progress }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className="kfu-label">{label}</span>

      <div
        className="kfu-stage"
        {...(!hasImage
          ? { role: "button", tabIndex: 0, onClick: openPicker, onKeyDown: onStageKey, "aria-label": `${label}: drop an image or press Enter to choose a file` }
          : {})}
      >
        <div className="kfu-floor" aria-hidden="true" />
        <div className="kfu-orbit kfu-orbit--back" aria-hidden="true">{RINGS}</div>

        <div className="kfu-core">
          {hasImage ? (
            <div className="kfu-card" aria-hidden="true">
              <div className="kfu-face kfu-face--front">
                {broken ? (
                  <span className="kfu-broken">Image unavailable</span>
                ) : (
                  <img src={displayImage} alt="" draggable={false} onError={() => setBrokenSrc(displayImage)} />
                )}
                <span className="kfu-sheen" />
              </div>
              <div className="kfu-face kfu-face--back">
                {!broken && <img src={displayImage} alt="" draggable={false} />}
                <b>KF</b>
              </div>
              <span className="kfu-face kfu-face--edge-l" />
              <span className="kfu-face kfu-face--edge-r" />
            </div>
          ) : (
            <div className="kfu-disc">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path d="M24 33V14M16 21l8-8 8 8" />
                <path d="M11 34v3a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3v-3" />
              </svg>
            </div>
          )}

          <div className="kfu-check" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5.5 12.5l4.2 4.2L18.5 7.6" />
            </svg>
          </div>
          <div className="kfu-sparks" aria-hidden="true">
            {SPARKS.map((index) => (
              <i key={index} style={{ "--a": `${index * 36}deg`, "--d": `${(index % 3) * 40}ms` }} />
            ))}
          </div>
        </div>

        <div className="kfu-orbit kfu-orbit--front" aria-hidden="true">{RINGS}</div>
      </div>

      <div className="kfu-meta">
        <p className="kfu-headline" role="status" aria-live="polite">{headline}</p>
        {detail && <p className={`kfu-detail${status === "error" ? " is-error" : ""}`}>{detail}</p>}
        {(uploading || status === "done") && (
          <div
            className="kfu-bar"
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <i style={{ transform: `scaleX(${progress})` }} />
          </div>
        )}
        {notice && <p className="kfu-notice" role="alert">{notice}</p>}
      </div>

      <div className="kfu-actions">
        {status === "idle" && (
          <button type="button" className="kfu-btn kfu-btn--primary" onClick={openPicker}>Browse files</button>
        )}
        {status === "uploading" && (
          <button type="button" className="kfu-btn" onClick={cancel}>Cancel upload</button>
        )}
        {(status === "done" || status === "ready") && (
          <>
            <button type="button" className="kfu-btn kfu-btn--primary" onClick={openPicker}>Replace</button>
            <button type="button" className="kfu-btn" onClick={remove}>Remove</button>
          </>
        )}
        {status === "error" && (
          <>
            <button type="button" className="kfu-btn kfu-btn--primary" onClick={() => fileRef.current && run(fileRef.current, uploadToServer)}>
              Try again
            </button>
            <button type="button" className="kfu-btn" onClick={() => fileRef.current && run(fileRef.current, saveInBrowser)}>
              Save in browser instead
            </button>
            <button type="button" className="kfu-btn" onClick={remove}>Remove</button>
          </>
        )}
      </div>

      <input ref={inputRef} className="kfu-input" type="file" accept={ACCEPT_ATTR} onChange={onPick} tabIndex={-1} aria-hidden="true" />
    </div>
  );
}
