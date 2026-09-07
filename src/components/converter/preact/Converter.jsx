import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { signal, computed } from '@preact/signals';

import VideoUploader from './VideoUploader.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import ExtractionControls from './ExtractionControls.jsx';
import FrameGallery from './FrameGallery.jsx';
import VideoInfoPanel from './VideoInfoPanel.jsx';
import Button from '../../ui/Button.jsx';
import Card from '../../ui/Card.jsx';

const formats = [
  { value: 'png', label: 'PNG (Lossless)', quality: false },
  { value: 'jpg', label: 'JPG', quality: true, min: 70, max: 95, default: 90 },
  { value: 'webp', label: 'WebP', quality: true, min: 70, max: 95, default: 80 },
  { value: 'avif', label: 'AVIF', quality: true, min: 50, max: 80, default: 60, notice: 'Safari 16.4+' },
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Converter() {
  const videoUrl = useRef(null);
  const videoPlayerRef = useRef(null);
  const videoElement = useRef(null);
  const canvas = useRef(null);
  const ctx = useRef(null);

  const [videoDuration, setVideoDuration] = useState(0);
  const [videoInfo, setVideoInfo] = useState({});
  const [frames, setFrames] = useState([]);
  const [extractionMode, setExtractionMode] = useState('manual');
  const [intervalSettings, setIntervalSettings] = useState({ interval: 1, startTime: 0, endTime: 0 });
  const [sceneSettings, setSceneSettings] = useState({ threshold: 0.3, minSceneDuration: 1 });
  const [outputSettings, setOutputSettings] = useState({ format: 'png', quality: 90 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [showFramePopup, setShowFramePopup] = useState(false);

  function initCanvas() {
    if (!canvas.current) {
      canvas.current = document.createElement('canvas');
      ctx.current = canvas.current.getContext('2d');
    }
  }

  async function handleFileSelect(file) {
    try {
      setIsProcessing(true);

      if (videoUrl.current) URL.revokeObjectURL(videoUrl.current);
      videoUrl.current = URL.createObjectURL(file);

      setShowConverter(true);

      await new Promise(resolve => setTimeout(resolve, 100));

      const video = videoPlayerRef.current?.getVideoElement?.();
      if (!video) {
        throw new Error('Video element not found');
      }

      videoElement.current = video;
      video.src = videoUrl.current;
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
      });

      const duration = video.duration;
      setVideoDuration(duration);
      setVideoInfo({
        name: file.name,
        type: file.type,
        size: file.size,
        duration,
        width: video.videoWidth,
        height: video.videoHeight,
        frameRate: 30,
        codec: file.type
      });

      setIntervalSettings(s => ({ ...s, endTime: duration }));
      setFrames([]);
    } catch (error) {
      console.error('Error loading video:', error);
      alert('Failed to load video. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleExtract(mode) {
    if (!videoElement.current || isProcessing) return;

    setIsProcessing(true);

    try {
      switch (mode) {
        case 'manual':
          await extractManualFrame();
          break;
        case 'interval':
          await extractIntervalFrames();
          break;
        case 'scene':
          await extractSceneFrames();
          break;
      }
    } catch (error) {
      console.error('Extraction error:', error);
      alert('Failed to extract frames. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function extractManualFrame() {
    initCanvas();
    const time = videoElement.current.currentTime;
    const frame = await captureFrameAtTime(time);
    setFrames(prev => [...prev, { ...frame, selected: true }]);
  }

  async function extractIntervalFrames() {
    initCanvas();
    const { interval, startTime, endTime } = intervalSettings;
    const times = [];

    for (let t = startTime; t <= Math.min(endTime, videoDuration); t += interval) {
      times.push(t);
    }

    const newFrames = [];
    for (let i = 0; i < times.length; i++) {
      const frame = await captureFrameAtTime(times[i]);
      newFrames.push({ ...frame, selected: true });
    }

    setFrames(prev => [...prev, ...newFrames]);
  }

  async function extractSceneFrames() {
    try {
      const { extractSlides } = await import('video-slide-extractor');

      const options = {
        threshold: sceneSettings.threshold,
        minSlideDuration: sceneSettings.minSceneDuration,
        onProgress: (progress) => {
          // Could update UI with progress
        }
      };

      const response = await fetch(videoUrl.current);
      const blob = await response.blob();

      const slides = await extractSlides(blob, options);

      const newFrames = [];
      for (const slide of slides) {
        const frame = await convertImageToFormat(slide.imageData, outputSettings.format, outputSettings.quality);
        newFrames.push({ ...frame, time: slide.timestamp, selected: true });
      }

      setFrames(prev => [...prev, ...newFrames]);
    } catch (error) {
      console.error('Scene detection failed:', error);
      await extractIntervalFrames();
    }
  }

  async function convertImageToFormat(imageDataUrl, format, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          initCanvas();
          canvas.current.width = img.width;
          canvas.current.height = img.height;
          ctx.current.drawImage(img, 0, 0);

          const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
          const qualityValue = quality / 100;
          const dataUrl = canvas.current.toDataURL(mimeType, qualityValue);

          const thumbCanvas = document.createElement('canvas');
          const thumbCtx = thumbCanvas.getContext('2d');
          const maxThumbSize = 400;
          const scale = Math.min(maxThumbSize / canvas.current.width, maxThumbSize / canvas.current.height);
          thumbCanvas.width = canvas.current.width * scale;
          thumbCanvas.height = canvas.current.height * scale;
          thumbCtx.drawImage(canvas.current, 0, 0, thumbCanvas.width, thumbCanvas.height);
          const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

          resolve({
            time: 0, // Time is not relevant for converted images, but we need to set it
            url: dataUrl,
            thumbnail,
            format,
            quality
          });
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = imageDataUrl;
    });
  }

  function captureFrameAtTime(time) {
    return new Promise((resolve, reject) => {
      const video = videoElement.current;
      if (!video) {
        reject(new Error('Video element not available'));
        return;
      }

      const targetTime = Math.max(0, Math.min(video.duration || time, time));
      let seekTimeout;
      let settled = false;

      const cleanup = () => {
        clearTimeout(seekTimeout);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };

      const settle = (callback) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };

      const captureFrame = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              canvas.current.width = video.videoWidth;
              canvas.current.height = video.videoHeight;
              ctx.current.drawImage(video, 0, 0);

              const format = outputSettings.format;
              const quality = outputSettings.quality / 100;
              const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;

              const dataUrl = canvas.current.toDataURL(mimeType, quality);

              const thumbCanvas = document.createElement('canvas');
              const thumbCtx = thumbCanvas.getContext('2d');
              const maxThumbSize = 400;
              const scale = Math.min(maxThumbSize / canvas.current.width, maxThumbSize / canvas.current.height);
              thumbCanvas.width = canvas.current.width * scale;
              thumbCanvas.height = canvas.current.height * scale;
              thumbCtx.drawImage(canvas.current, 0, 0, thumbCanvas.width, thumbCanvas.height);
              const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

              resolve({
                time: targetTime,
                url: dataUrl,
                thumbnail,
                format: outputSettings.format,
                quality: outputSettings.quality
              });
            } catch (error) {
              reject(error);
            }
          });
        });
      };

      const handleSeeked = () => {
        if (Math.abs(video.currentTime - targetTime) <= 0.05) {
          settle(captureFrame);
        }
      };
      const handleError = () => settle(() => reject(new Error('Video seek failed')));

      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);
      seekTimeout = setTimeout(() => {
        settle(() => reject(new Error(`Unable to seek video to ${targetTime.toFixed(2)}s`)));
      }, 10000);

      video.pause();
      video.currentTime = targetTime;

      if (Math.abs(video.currentTime - targetTime) <= 0.05 && video.readyState >= 2) {
        settle(captureFrame);
      }
    });
  }

  function handleSelectionChange(index, selected) {
    setFrames(prev => prev.map((f, i) => i === index ? { ...f, selected } : f));
  }

  function handleDownloadSingle(frame) {
    downloadFrame(frame, `${frame.time.toFixed(2)}s.${frame.format}`);
  }

  function handleDownloadSelected(selectedFrames) {
    if (selectedFrames.length === 1) {
      handleDownloadSingle(selectedFrames[0]);
    } else {
      downloadFramesAsZip(selectedFrames);
    }
  }

  function handleDownloadAll(allFrames) {
    downloadFramesAsZip(allFrames);
  }

  function handleRemoveFrame(index) {
    setFrames(prev => prev.filter((_, i) => i !== index));
  }

  function handleClearAll() {
    setFrames([]);
  }

  function handleDeselectAll() {
    setFrames(prev => prev.map(frame => ({ ...frame, selected: false })));
  }

  async function downloadFramesAsZip(framesToDownload) {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    const folder = zip.folder('frames');

    framesToDownload.forEach((frame, index) => {
      const base64 = frame.url.split(',')[1];
      const filename = `frame_${String(index + 1).padStart(4, '0')}_${frame.time.toFixed(2)}s.${frame.format}`;
      folder.file(filename, base64, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-frames-${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadFrame(frame, filename) {
    const link = document.createElement('a');
    link.href = frame.url;
    link.download = filename;
    link.click();
  }

  return (
    <div class="card min-w-0 overflow-hidden p-0 shadow-[0px_2px_2px_rgba(0,0,0,0.04),0px_12px_28px_-12px_rgba(0,0,0,0.12)]" data-testid="video-converter">
      <div class="space-y-8 p-4 sm:p-6 lg:p-8">
        <section aria-labelledby="upload-heading">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <p class="eyebrow mb-1">Start here</p>
              <h2 id="upload-heading" class="heading-md">Upload a video</h2>
            </div>
            <span class="hidden body-sm sm:block">MP4, WebM, MOV and more</span>
          </div>
          <VideoUploader
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
            data-testid="video-uploader"
          />
        </section>

        {showConverter && (
          <section id="converter-content" class="animate-slide-up" aria-label="Video workspace">
            <div class="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:items-start">
              <div class="min-w-0 space-y-4">
                <div class="flex items-end justify-between gap-4">
                  <div>
                    <p class="eyebrow mb-1">Preview</p>
                    <h2 class="heading-md">Choose your frame</h2>
                  </div>
                  <span class="hidden body-sm sm:block">Use the timeline to find the exact moment</span>
                </div>
                <VideoPlayer
                  id="video-player"
                  ref={videoPlayerRef}
                  src={videoUrl.current}
                  onTimeUpdate={() => { }}
                  onLoadedMetadata={(duration) => setVideoDuration(duration)}
                  onSeeked={() => { }}
                  data-testid="video-player"
                />
              </div>

              <div class="min-w-0">
                <p class="eyebrow mb-1">Extraction settings</p>
                <h2 class="heading-md mb-4">How should we capture frames?</h2>
                <ExtractionControls
                  id="extraction-controls"
                  mode={extractionMode}
                  onModeChange={setExtractionMode}
                  intervalSettings={intervalSettings}
                  onIntervalChange={setIntervalSettings}
                  sceneSettings={sceneSettings}
                  onSceneChange={setSceneSettings}
                  outputSettings={outputSettings}
                  onOutputChange={setOutputSettings}
                  duration={videoDuration}
                  onExtract={handleExtract}
                  disabled={!videoUrl.current || isProcessing}
                  isExtracting={isProcessing}
                  data-testid="extraction-controls"
                />
              </div>
            </div>
          </section>
        )}

        {showConverter && (
          <>
            <section aria-labelledby="frames-heading">
              <div class="mb-4">
                <p class="eyebrow mb-1">Results</p>
                <h2 id="frames-heading" class="heading-md">Extracted frames</h2>
              </div>
              <FrameGallery
                id="frame-gallery"
                frames={frames}
                onSelectionChange={handleSelectionChange}
                onDownloadSingle={handleDownloadSingle}
                onDownloadSelected={handleDownloadSelected}
                onDownloadAll={handleDownloadAll}
                onSelectAll={() => setFrames(prev => prev.map(frame => ({ ...frame, selected: true })))}
                onRemoveFrame={handleRemoveFrame}
                onClearAll={handleClearAll}
                onDeselectAll={handleDeselectAll}
                onViewPopup={() => setShowFramePopup(true)}
                isProcessing={isProcessing}
                data-testid="frame-gallery"
              />
            </section>

            <section aria-labelledby="video-info-heading">
              <div class="mb-4">
                <p class="eyebrow mb-1">File details</p>
                <h2 id="video-info-heading" class="heading-md">Video information</h2>
              </div>
              <VideoInfoPanel
                videoInfo={videoInfo}
                data-testid="video-info-panel"
              />
            </section>
          </>
        )}

        {showFramePopup && (
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-4">
              <div class="relative flex h-[calc(100vh-1rem)] max-h-[90vh] w-full max-w-[95%] min-w-0 flex-col overflow-hidden rounded-lg bg-white sm:h-[90vh]">
                <div class="flex shrink-0 items-center justify-between gap-3 border-b bg-[var(--color-canvas-elevated)] p-3 sm:p-4">
                  <h3 class="heading-md">All Extracted Frames</h3>
                  <button
                    type="button"
                    class="btn-ghost text-[var(--color-error)] hover:text-[var(--color-error-deep)]"
                    onClick={() => setShowFramePopup(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div class="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  <div class="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
                    {frames.map((frame, index) => (
                      <div
                        key={index}
                        class={`relative overflow-hidden rounded border border-[var(--color-hairline)] bg-[var(--color-canvas)] ${frame.selected ? 'ring-2 ring-[var(--color-ink)]' : ''}`}
                      >
                        <img
                          src={frame.thumbnail || frame.url}
                          alt={`Frame ${index + 1} at ${frame.time.toFixed(2)}s`}
                          class="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 text-white">
                          <span class="font-mono text-xs">Frame {index + 1} · {frame.time.toFixed(2)}s</span>
                          <div class="flex items-center gap-2">
                            <input
                              type="checkbox"
                              class="w-5 h-5 rounded border-white/70 text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-white accent-[var(--color-ink)]"
                              checked={frame.selected}
                              onChange={(e) => handleSelectionChange(index, e.target.checked)}
                              aria-label={`Select frame ${index + 1}`}
                            />
                            <button
                              type="button"
                              class="btn-ghost p-1 text-white hover:text-white"
                              onClick={() => handleDownloadSingle(frame)}
                              title={`Download frame ${index + 1}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                  <div class="flex shrink-0 flex-col gap-3 border-t bg-[var(--color-canvas-elevated)] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div class="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        class="btn-secondary"
                        onClick={() => {
                          // Select all frames
                          frames.forEach((_, index) => handleSelectionChange(index, true));
                        }}
                        disabled={isProcessing || frames.length === 0}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        class="btn-secondary"
                        onClick={() => {
                          // Deselect all frames
                          frames.forEach((_, index) => handleSelectionChange(index, false));
                        }}
                        disabled={isProcessing || frames.length === 0}
                      >
                        Deselect All
                      </button>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="btn-secondary"
                        onClick={() => handleDownloadSelected?.(frames.filter(f => f.selected))}
                        disabled={isProcessing || frames.filter(f => f.selected).length === 0}
                      >
                        Download Selected
                      </button>
                      <button
                        type="button"
                        class="btn-primary"
                        onClick={() => handleDownloadAll?.(frames)}
                        disabled={isProcessing || frames.length === 0}
                      >
                        Download All as ZIP
                      </button>
                    </div>
                  </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}