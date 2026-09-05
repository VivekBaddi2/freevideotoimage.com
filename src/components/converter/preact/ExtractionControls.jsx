import { useState, useEffect } from 'preact/hooks';
import Button from '../../ui/Button.jsx';
import Input from '../../ui/Input.jsx';

const formats = [
  { value: 'png', label: 'PNG (Lossless)', quality: false },
  { value: 'jpg', label: 'JPG', quality: true, min: 70, max: 95, default: 90 },
  { value: 'webp', label: 'WebP', quality: true, min: 70, max: 95, default: 80 },
  { value: 'avif', label: 'AVIF', quality: true, min: 50, max: 80, default: 60, notice: 'Safari 16.4+' },
];

export default function ExtractionControls({
  mode = 'manual',
  onModeChange,
  intervalSettings = { interval: 1, startTime: 0, endTime: 0 },
  onIntervalChange,
  sceneSettings = { threshold: 0.3, minSceneDuration: 1 },
  onSceneChange,
  outputSettings = { format: 'png', quality: 90 },
  onOutputChange,
  duration = 0,
  onExtract,
  disabled = false,
  isExtracting = false,
  'data-testid': testId = 'extraction-controls'
}) {
  const [localIntervalSettings, setLocalIntervalSettings] = useState(intervalSettings);
  const [localSceneSettings, setLocalSceneSettings] = useState(sceneSettings);
  const [localOutputSettings, setLocalOutputSettings] = useState(outputSettings);

  useEffect(() => {
    setLocalIntervalSettings(intervalSettings);
  }, [intervalSettings]);

  useEffect(() => {
    setLocalSceneSettings(sceneSettings);
  }, [sceneSettings]);

  useEffect(() => {
    setLocalOutputSettings(outputSettings);
  }, [outputSettings]);

  function handleIntervalChange(key, value) {
    const newSettings = { ...localIntervalSettings, [key]: value };
    setLocalIntervalSettings(newSettings);
    onIntervalChange?.(newSettings);
  }

  function handleSceneChange(key, value) {
    const newSettings = { ...localSceneSettings, [key]: value };
    setLocalSceneSettings(newSettings);
    onSceneChange?.(newSettings);
  }

  function handleOutputChange(key, value) {
    const newSettings = { ...localOutputSettings, [key]: value };
    setLocalOutputSettings(newSettings);
    onOutputChange?.(newSettings);
  }

  const currentFormat = formats.find(f => f.value === localOutputSettings.format);

  return (
    <div class="card p-4" data-testid={testId}>
      <div class="mb-6">
        <label class="label">Extraction Mode</label>
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Extraction mode">
          {['manual', 'interval', 'automatic'].map(m => (
            <Button
              key={m}
              type="button"
              size='md'
              variant="nav"
              class={mode === m ? ' bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink)] border-[var(--color-ink)] text-sm' : 'text-sm text-gray-600 border-0'}
              onClick={() => onModeChange?.(m)}
              disabled={disabled || isExtracting}
              role="radio"
              aria-checked={mode === m}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {mode === 'manual' && (
        <div class="space-y-4 animate-fade-in">
          <p class="body-md text-[var(--color-body)]">
            Use the video player above to navigate frame-by-frame and capture individual frames.
          </p>
          <div class="flex gap-3">
            <Button
              type="button"
              size='md'
              class='text-sm cursor-pointer'
              onClick={() => onExtract?.('manual')}
              disabled={disabled || isExtracting}
            >
              {isExtracting ? 'Capturing...' : 'Capture Current Frame'}
            </Button>
          </div>
        </div>
      )}

      {mode === 'interval' && (
        <div class="space-y-4 animate-fade-in">
          <div class="grid grid-cols-1 gap-2">
            <Input
              label="Interval (seconds)"
              type="number"
              step="0.1"
              min="0.1"
              max={duration}
              value={localIntervalSettings.interval}
              onChange={(e) => handleIntervalChange('interval', parseFloat(e.target.value) || 0)}
              disabled={disabled || isExtracting}
            />
            <Input
              label="Start Time (seconds)"
              type="number"
              step="0.1"
              min="0"
              max={duration}
              value={localIntervalSettings.startTime}
              onChange={(e) => handleIntervalChange('startTime', parseFloat(e.target.value) || 0)}
              disabled={disabled || isExtracting}
            />
            <Input
              label="End Time (seconds)"
              type="number"
              step="0.1"
              min="0"
              max={duration}
              value={localIntervalSettings.endTime || duration}
              hint={localIntervalSettings.endTime ? undefined : `Video duration: ${duration.toFixed(1)}s`}
              onChange={(e) => handleIntervalChange('endTime', parseFloat(e.target.value) || duration)}
              disabled={disabled || isExtracting}
            />
          </div>

          <p class="body-sm text-[var(--color-mute)]">
            Estimated frames: {Math.max(0, Math.floor(((localIntervalSettings.endTime || duration) - localIntervalSettings.startTime) / localIntervalSettings.interval)) + 1}
          </p>

          <Button
            type="button"
            size='md'
            class='text-sm cursor-pointer'
            onClick={() => onExtract?.('interval')}
            disabled={disabled || isExtracting}
          >
            {isExtracting ? 'Extracting...' : 'Extract Frames'}
          </Button>
        </div>
      )}

      {mode === 'automatic' && (
        <div class="space-y-4 animate-fade-in">
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="label">Scene Threshold: {localSceneSettings.threshold.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={localSceneSettings.threshold}
                class="w-full h-2 bg-[var(--color-hairline)] rounded-full appearance-none cursor-pointer accent-[var(--color-ink)]"
                onInput={(e) => handleSceneChange('threshold', parseFloat(e.target.value))}
                disabled={disabled || isExtracting}
              />
              <p class="body-sm text-[var(--color-mute)] mt-1">Lower = more sensitive (more scenes detected)</p>
            </div>
            <Input
              label="Min Scene Duration (s)"
              type="number"
              step="0.1"
              min="0.1"
              max={duration}
              value={localSceneSettings.minSceneDuration}
              onChange={(e) => handleSceneChange('minSceneDuration', parseFloat(e.target.value))}
              disabled={disabled || isExtracting}
            />
          </div>

          <p class="body-sm text-[var(--color-mute)]">
            Uses AI-powered scene detection to extract key frames at scene boundaries.
          </p>

          <Button
            type="button"
            size='md'
            class='text-sm cursor-pointer'
            onClick={() => onExtract?.('scene')}
            disabled={disabled || isExtracting}
          >
            {isExtracting ? 'Detecting Scenes...' : 'Detect Scenes & Extract'}
          </Button>
        </div>
      )}

      <div class="mt-8 pt-6 border-t border-[var(--color-hairline)] animate-fade-in">
        <label class="label">Output Format</label>
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Output format">
            {formats.map(f => (
              <Button
                key={f.value}
                type="button"
                variant="nav"
                size='sm'
                class={localOutputSettings.format === f.value ? 'bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink)] border-[var(--color-ink)] text-sm' : 'text-sm text-gray-600 border-0'}
                onClick={() => handleOutputChange('format', f.value)}
                disabled={disabled || isExtracting}
                role="radio"
                aria-checked={localOutputSettings.format === f.value}
              >
                {f.label}
                {f.notice && <span class="ml-1 text-xs text-[var(--color-warning)]">({f.notice})</span>}
              </Button>
            ))}
          </div>

          {currentFormat?.quality && (
            <div>
              <label class="label">Quality: {localOutputSettings.quality}%</label>
              <input
                type="range"
                min={currentFormat.min}
                max={currentFormat.max}
                value={localOutputSettings.quality}
                class="w-full h-2 bg-[var(--color-hairline)] rounded-full appearance-none cursor-pointer accent-[var(--color-ink)]"
                onInput={(e) => handleOutputChange('quality', parseInt(e.target.value))}
                disabled={disabled || isExtracting}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}