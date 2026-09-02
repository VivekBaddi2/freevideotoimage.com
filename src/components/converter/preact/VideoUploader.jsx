import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import Button from '../../ui/Button.jsx';

export default function VideoUploader({ onFileSelect, disabled = false, accept = 'video/*', maxSize = 2147483648, 'data-testid': testId = 'video-uploader' }) {
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const MAX_SIZE_MB = Math.round(maxSize / (1024 * 1024));
  const WARNING_SIZE_MB = 500;

  function handleFile(file) {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }

    if (file.size > maxSize) {
      alert(`File size exceeds the maximum limit of ${MAX_SIZE_MB}MB.`);
      return;
    }

    if (file.size > WARNING_SIZE_MB * 1024 * 1024) {
      if (!confirm(`This file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Large files may take longer to process. Continue?`)) {
        return;
      }
    }

    onFileSelect(file);
  }

  function handleFileInputChange(e) {
    const file = e.target.files[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    setIsDragOver(true);
  }

  function unhighlight() {
    setIsDragOver(false);
  }

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    if (file) handleFile(file);
    setIsDragOver(false);
  }

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.removeEventListener(eventName, preventDefaults, false);
      });
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.removeEventListener(eventName, highlight, false);
      });
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.removeEventListener(eventName, unhighlight, false);
      });
      dropZone.removeEventListener('drop', handleDrop, false);
    };
  }, []);

  return (
    <div
      ref={dropZoneRef}
      class={`border-2 border-dashed rounded-[var(--radius-lg)] p-8 md:p-12 text-center transition-colors duration-200 ${
        isDragOver ? 'border-[var(--color-ink)] bg-[var(--color-link-soft)]' : 'border-[var(--color-hairline)] hover:border-[var(--color-mute)]'
      }`}
      data-testid={testId}
    >
      <input
        ref={fileInputRef}
        type="file"
        id="video-upload"
        accept={accept}
        class="hidden"
        disabled={disabled}
        onChange={handleFileInputChange}
      />

      <label
        htmlFor="video-upload"
        class="cursor-pointer"
        aria-label="Upload video file"
      >
        <svg
          class="mx-auto mb-4 text-[var(--color-mute)]"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <p class="heading-md mb-2">Drop your video here</p>
        <p class="body-md text-[var(--color-body)] mb-6">
          or click to browse. Supports MP4, WebM, MOV, AVI, MKV (up to {MAX_SIZE_MB}MB)
        </p>

        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
        >
          Choose File
        </Button>
      </label>

      <p class="mt-4 body-sm text-[var(--color-mute)]">
        Maximum file size: {MAX_SIZE_MB}MB. Warning at {WARNING_SIZE_MB}MB.
      </p>
    </div>
  );
}