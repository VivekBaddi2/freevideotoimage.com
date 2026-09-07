import { useState, useEffect, useRef, useCallback, useImperativeHandle } from 'preact/hooks';
import { forwardRef } from 'preact/compat';
import Button from '../../ui/Button.jsx';

const VideoPlayer = forwardRef(function VideoPlayer({ src, currentTime = 0, onTimeUpdate, onLoadedMetadata, onSeeked, 'data-testid': testId = 'video-player' }, ref) {
  const videoRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current
  }));
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekPercent, setSeekPercent] = useState(0);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onLoadedMetadata?.(video.duration);
    };

    const handleTimeUpdate = () => {
      const percent = (video.currentTime / video.duration) * 100;
      setSeekPercent(percent);
      onTimeUpdate?.(video.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleSeeked = () => onSeeked?.(video.currentTime);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [onTimeUpdate, onLoadedMetadata, onSeeked]);

  function handlePlayPause() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }

  function handleSeek(e) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const percent = parseFloat(e.target.value);
    video.currentTime = (percent / 100) * video.duration;
  }

  function handleTimeInputChange(e) {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    if (!isNaN(time)) video.currentTime = Math.max(0, Math.min(video.duration, time));
  }

  function handleRewind(seconds = 1) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - seconds);
  }

  function handleForward(seconds = 1) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, video.currentTime + seconds);
  }

  function handleFrameStep(direction) {
    const video = videoRef.current;
    if (!video) return;
    const frameDuration = 1 / 30; // ~30fps
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + direction * frameDuration));
  }

  // Touch scrubbing support
  const touchStartRef = useRef({ x: 0, time: 0 });

  function handleTouchStart(e) {
    touchStartRef.current = { x: e.touches[0].clientX, time: videoRef.current?.currentTime || 0 };
  }

  function handleTouchMove(e) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const slider = e.target;
    const percentDelta = (deltaX / slider.offsetWidth) * 100;
    const newPercent = Math.max(0, Math.min(100, seekPercent + percentDelta));
    setSeekPercent(newPercent);
    video.currentTime = (newPercent / 100) * video.duration;
  }

return (
    <div class="relative min-w-0" data-testid={testId}>
      <div class="flex justify-center">
        <video
          ref={videoRef}
          id="video-element"
          src={src}
          class="aspect-video w-full rounded-(--radius-md) bg-canvas object-contain"
          controls
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <div class="mx-auto mt-4 max-w-200 space-y-3 px-3 sm:px-(--spacing-lg)">
        <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
          <label htmlFor="time-input" class="body-sm text-mute whitespace-nowrap">
            Time:
          </label>
          <input
            type="number"
            id="time-input"
            step="0.01"
            min="0"
            max={duration}
            class="input w-24 text-center"
            value={videoRef.current?.currentTime?.toFixed(2) || '0.00'}
            onChange={handleTimeInputChange}
          />
          <span class="body-sm text-mute" id="duration-display">/ {formatTime(duration)}</span>
        </div>

        <div class="flex items-center justify-center gap-3 flex-wrap">
          <Button
            type="button"
            variant="nav"
            onClick={() => handleRewind(1)}
            aria-label="Rewind 1 second"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" />
            </svg>
          </Button>

          <Button
            type="button"
            variant="nav"
            onClick={() => handleFrameStep(-1)}
            aria-label="Previous frame (~30fps)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="11 19 3 12 11 5 11 19" />
              <line x1="15" y1="5" x2="15" y2="19" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </Button>

          <Button
            type="button"
            variant="primary"
            id="play-pause-btn"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </Button>

          <Button
            type="button"
            variant="nav"
            onClick={() => handleFrameStep(1)}
            aria-label="Next frame (~30fps)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="13 19 21 12 13 5 13 19" />
              <line x1="5" y1="5" x2="5" y2="19" />
              <line x1="9" y1="5" x2="9" y2="19" />
            </svg>
          </Button>

          <Button
            type="button"
            variant="nav"
            onClick={() => handleForward(1)}
            aria-label="Forward 1 second"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </Button>
        </div>

        <input
          type="range"
          id="seek-slider"
          min="0"
          max="100"
          value={seekPercent}
          step="0.01"
          class="w-full h-2 bg-hairline rounded-full appearance-none cursor-pointer accent-ink"
          onInput={handleSeek}
          onChange={handleSeek}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          aria-label="Seek video"
        />
      </div>
    </div>
  );
});

export default VideoPlayer;