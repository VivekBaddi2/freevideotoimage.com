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

      videoElement.current = document.getElementById('video-element');
      if (!videoElement.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
        videoElement.current = document.getElementById('video-element');
      }

      videoElement.current.src = videoUrl.current;
      await new Promise((resolve, reject) => {
        videoElement.current.onloadedmetadata = resolve;
        videoElement.current.onerror = reject;
      });

      const duration = videoElement.current.duration;
      setVideoDuration(duration);
      setVideoInfo({
        name: file.name,
        type: file.type,
        size: file.size,
        duration,
        width: videoElement.current.videoWidth,
        height: videoElement.current.videoHeight,
        frameRate: 30,
        codec: file.type
      });

      setIntervalSettings(s => ({ ...s, endTime: duration }));
      setFrames([]);
      setShowConverter(true);
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

      if (i % 5 === 0) {
        setFrames(prev => [...prev, ...newFrames]);
      }
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

      const newFrames = slides.map(slide => ({
        time: slide.timestamp,
        url: slide.imageData,
        thumbnail: slide.imageData,
        selected: true,
        format: outputSettings.format,
        quality: outputSettings.quality
      }));

      setFrames(prev => [...prev, ...newFrames]);
    } catch (error) {
      console.error('Scene detection failed:', error);
      await extractIntervalFrames();
    }
  }

  function captureFrameAtTime(time) {
    return new Promise((resolve, reject) => {
      videoElement.current.currentTime = time;
      videoElement.current.onseeked = () => {
        try {
          canvas.current.width = videoElement.current.videoWidth;
          canvas.current.height = videoElement.current.videoHeight;
          ctx.current.drawImage(videoElement.current, 0, 0);

          const format = outputSettings.format;
          const quality = outputSettings.quality / 100;
          const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;

          const dataUrl = canvas.current.toDataURL(mimeType, quality);

          const thumbCanvas = document.createElement('canvas');
          const thumbCtx = thumbCanvas.getContext('2d');
          const maxThumbSize = 200;
          const scale = Math.min(maxThumbSize / canvas.current.width, maxThumbSize / canvas.current.height);
          thumbCanvas.width = canvas.current.width * scale;
          thumbCanvas.height = canvas.current.height * scale;
          thumbCtx.drawImage(canvas.current, 0, 0, thumbCanvas.width, thumbCanvas.height);
          const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

          resolve({
            time,
            url: dataUrl,
            thumbnail,
            format: outputSettings.format,
            quality: outputSettings.quality
          });
        } catch (e) {
          reject(e);
        }
      };
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
    <div class="card" data-testid="video-converter">
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <VideoUploader
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
            data-testid="video-uploader"
          />

          {showConverter && (
            <div id="converter-content" class="space-y-6 animate-slide-up">
              <VideoPlayer
                id="video-player"
                src={videoUrl.current}
                onTimeUpdate={() => {}}
                onLoadedMetadata={(duration) => setVideoDuration(duration)}
                onSeeked={() => {}}
                data-testid="video-player"
              />

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
          )}

          <FrameGallery
            id="frame-gallery"
            frames={frames}
            onSelectionChange={handleSelectionChange}
            onDownloadSingle={handleDownloadSingle}
            onDownloadSelected={handleDownloadSelected}
            onDownloadAll={handleDownloadAll}
            onRemoveFrame={handleRemoveFrame}
            onClearAll={handleClearAll}
            isProcessing={isProcessing}
            data-testid="frame-gallery"
          />
        </div>

        <aside class="lg:col-span-1">
          <VideoInfoPanel
            videoInfo={videoInfo}
            data-testid="video-info-panel"
          />
        </aside>
      </div>
    </div>
  );
}