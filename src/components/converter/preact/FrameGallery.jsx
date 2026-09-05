import { useState, useEffect, useRef } from 'preact/hooks';
import Button from '../../ui/Button.jsx';

export default function FrameGallery({
  frames = [],
  onSelectionChange,
  onDownloadSingle,
  onDownloadSelected,
  onDownloadAll,
  onDeselectAll,
  onViewPopup,
  onRemoveFrame,
  onClearAll,
  isProcessing = false,
  'data-testid': testId = 'frame-gallery'
}) {
  const [lastCheckedIndex, setLastCheckedIndex] = useState(-1);

  const selectedFrames = frames.filter(f => f.selected);
  const hasSelection = selectedFrames.length > 0;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        frames.forEach((_, i) => {
          if (!frames[i].selected) {
            onSelectionChange?.(i, true);
          }
        });
      }

      if (e.shiftKey && e.key === 'ArrowRight' && lastCheckedIndex !== -1) {
        e.preventDefault();
        const next = lastCheckedIndex + 1;
        if (next < frames.length) {
          onSelectionChange?.(next, true);
          setLastCheckedIndex(next);
        }
      }

      if (e.shiftKey && e.key === 'ArrowLeft' && lastCheckedIndex !== -1) {
        e.preventDefault();
        const prev = lastCheckedIndex - 1;
        if (prev >= 0) {
          onSelectionChange?.(prev, true);
          setLastCheckedIndex(prev);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [frames, lastCheckedIndex, onSelectionChange]);

  function handleCheckboxChange(index, selected) {
    onSelectionChange?.(index, selected);
    if (selected) setLastCheckedIndex(index);
  }

  if (frames.length === 0) {
    return (
      <div class="card" data-testid={testId}>
        <div class="text-center py-12">
          <svg
            class="mx-auto mb-4 text-[var(--color-faint)]"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p class="body-md text-[var(--color-mute)]">No frames extracted yet</p>
          <p class="body-sm text-[var(--color-faint)] mt-1">Use the extraction controls to capture frames from your video</p>
        </div>
      </div>
    );
  }

  return (
    <div class="card" data-testid={testId}>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 class="heading-md">{frames.length} frame{frames.length !== 1 ? 's' : ''} extracted</h3>
          {hasSelection && (
            <p class="body-sm text-[var(--color-mute)] mt-1">
              {selectedFrames.length} selected
            </p>
          )}
        </div>

        <div class="flex flex-wrap gap-2">
          {hasSelection && (
            <>
              <Button
                variant="secondary"
                onClick={() => onDownloadSelected?.(selectedFrames)}
                disabled={isProcessing}
              >
                Download Selected ({selectedFrames.length})
              </Button>
              <Button
                variant="secondary"
                onClick={() => onDeselectAll?.()}
                disabled={isProcessing || !hasSelection}
              >
                Deselect All
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (onViewPopup) {
                    onViewPopup();
                  }
                }}
                disabled={isProcessing || frames.length === 0}
              >
                View All in Popup
              </Button>
            </>
          )}
          <Button
            variant="primary"
            onClick={() => onDownloadAll?.(frames)}
            disabled={frames.length === 0 || isProcessing}
          >
            Download All as ZIP ({frames.length})
          </Button>
          {frames.length > 0 && (
            <Button
              variant="ghost"
              class="text-[var(--color-error)] hover:text-[var(--color-error-deep)]"
              onClick={() => onClearAll?.()}
              disabled={isProcessing}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {frames.map((frame, index) => (
          <article
            key={index}
            class={`relative group aspect-video rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-hairline)] bg-[var(--color-canvas)] transition-all duration-200 ${frame.selected ? 'ring-2 ring-[var(--color-ink)]' : ''}`}
            data-frame-index={index}
          >
            <input
              type="checkbox"
              class="absolute top-2 left-2 z-10 w-5 h-5 rounded-[var(--radius-sm)] border-[var(--color-hairline)] text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-link)] accent-[var(--color-ink)]"
              checked={frame.selected}
              onChange={(e) => handleCheckboxChange(index, e.target.checked)}
              aria-label={`Select frame ${index + 1}`}
            />

            <img
              src={frame.thumbnail || frame.url}
              alt={`Frame ${index + 1} at ${frame.time.toFixed(2)}s`}
              class="w-full h-full object-cover"
              loading="lazy"
            />

            <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs">
              <span class="font-mono">{frame.time.toFixed(2)}s</span>
            </div>

            <div class="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
              <Button
                variant="nav"
                size="sm"
                class="p-1.5 sm:size-7 sm:p-0 sm:gap-0 text-[var(--color-body)] hover:text-[var(--color-ink)]"
                onClick={(e) => { e.stopPropagation(); onDownloadSingle?.(frame); }}
                aria-label={`Download frame ${index + 1}`}
                disabled={isProcessing}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </Button>
              <Button
                variant="nav"
                size="sm"
                class="p-1.5 sm:size-7 sm:p-0 sm:gap-0 text-[var(--color-error)] hover:text-[var(--color-error-deep)] hover:bg-[var(--color-warning-soft)]"
                onClick={(e) => { e.stopPropagation(); onRemoveFrame?.(index); }}
                aria-label={`Remove frame ${index + 1}`}
                disabled={isProcessing}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div class="mt-6 pt-6 border-t border-[var(--color-hairline)]">
        <p class="body-sm text-[var(--color-mute)]">
          <strong>Tip:</strong> Click checkboxes to select multiple frames. Use Shift+Click for range selection.
          Download selected frames or all frames as a ZIP archive.
        </p>
      </div>
    </div>
  );
}