/*
  Upload transport for the product-image uploader.

  Nothing in here is simulated:
   - uploadToServer() reports the browser's real XMLHttpRequest upload progress
     (bytes sent / total bytes) and only resolves when the server answers with 2xx
     and an image URL.
   - saveInBrowser() is an honest offline fallback: it reads the file with
     FileReader (real read progress), downsizes it on a canvas and returns a
     data: URL that is stored with the product in this browser.

  Server contract (see backend/UploadController.java):
     POST  {UPLOAD_URL}      multipart/form-data, field name "file"
     200 → { "url": "/uploads/<name>.jpg" }
     4xx/5xx → { "message": "reason" }
*/

export const UPLOAD_URL = import.meta.env?.VITE_UPLOAD_URL || "/api/uploads";
export const MAX_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Returns a human-readable problem, or null when the file is acceptable. */
export function validateImage(file) {
  if (!file) return "No file selected.";
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `“${file.name}” is not a supported image. Use JPG, PNG, WEBP, AVIF or GIF.`;
  }
  if (file.size > MAX_BYTES) {
    return `“${file.name}” is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_BYTES)}.`;
  }
  if (file.size === 0) return `“${file.name}” is empty.`;
  return null;
}

function abortError() {
  const error = new Error("Upload cancelled");
  error.name = "AbortError";
  return error;
}

/**
 * Upload to the Spring Boot endpoint.
 * @param {File} file
 * @param {{ onProgress?: (ratio:number)=>void, signal?: AbortSignal }} options
 * @returns {Promise<{ url: string }>}
 */
export function uploadToServer(file, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());

    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file, file.name);

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const cleanup = () => signal?.removeEventListener("abort", onAbort);

    xhr.open("POST", UPLOAD_URL);
    xhr.responseType = "text";
    xhr.timeout = 120000;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total);
    };

    xhr.onload = () => {
      cleanup();
      let data = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        // non-JSON body (e.g. an HTML error page): fall through to the status handling below
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const url = data?.url ?? data?.imageUrl ?? data?.path;
        if (typeof url === "string" && url) return resolve({ url });
        return reject(new Error("The server accepted the file but did not return an image URL."));
      }
      if (xhr.status === 404) {
        return reject(new Error(`Upload endpoint not found (POST ${UPLOAD_URL}). Is the Spring Boot server running?`));
      }
      if (xhr.status === 413) {
        return reject(new Error("The server rejected the file as too large."));
      }
      const reason = data?.message || data?.error;
      reject(new Error(reason ? `Upload failed: ${reason}` : `Upload failed (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error("Could not reach the server. Check that the Spring Boot backend is running."));
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(new Error("The upload timed out."));
    };
    xhr.onabort = () => {
      cleanup();
      reject(abortError());
    };

    xhr.send(form);
  });
}

/**
 * Offline fallback. Reads the file (real FileReader progress), then resizes it
 * so it fits comfortably in localStorage. Resolves with a data: URL.
 */
export function saveInBrowser(file, { onProgress, signal, maxEdge = 1400 } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const reader = new FileReader();
    const onAbort = () => reader.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    const cleanup = () => signal?.removeEventListener("abort", onAbort);

    reader.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.((event.loaded / event.total) * 0.85);
    };
    reader.onabort = () => {
      cleanup();
      reject(abortError());
    };
    reader.onerror = () => {
      cleanup();
      reject(new Error("The browser could not read that file."));
    };
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => {
        cleanup();
        reject(new Error("That file could not be decoded as an image."));
      };
      image.onload = () => {
        cleanup();
        const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff"; // JPEG has no alpha; avoid black where a PNG was transparent
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        onProgress?.(1);
        resolve({ url: canvas.toDataURL("image/jpeg", 0.86) });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
