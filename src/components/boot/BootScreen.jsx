import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@arco-design/web-react';
import {
  IconArrowRight,
  IconLoading,
  IconMute,
  IconSound,
} from '@arco-design/web-react/icon';
import BrandMark from '../common/BrandMark';

/**
 * 启动动画层
 * ------------------------------------------------------------------
 * boot.mp4 作为全屏前置动画，视频结束后才通过 onFinish 挂载后台管理页。
 *
 * 声音策略：
 * 1. 优先尝试带声音自动播放；
 * 2. 浏览器自动播放策略拦截时，降级为静音播放，并显示「开启声音」提示；
 * 3. 用户点击后重新以带声音方式播放，右上角也可随时静音 / 取消静音。
 */
export default function BootScreen({ onFinish, isLeaving }) {
  const videoRef = useRef(null);
  const finishRef = useRef(onFinish);
  const startedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  finishRef.current = onFinish;

  /**
   * 以带声音的方式尝试播放。
   * 必须在用户手势中调用，否则部分浏览器会拒绝 unmuted autoplay。
   */
  const playWithSound = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return false;

    video.muted = false;
    video.volume = 0.9;

    try {
      await video.play();
      setSoundEnabled(true);
      setAutoplayBlocked(false);
      setNeedsInteraction(false);
      return true;
    } catch {
      setSoundEnabled(false);
      return false;
    }
  }, []);

  /**
   * 启动序列：先尝试带声音自动播放；被拦截则静音播放。
   * 如果连静音播放也被拦截，再展示手动启动按钮。
   */
  const startPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const soundPlayed = await playWithSound();
    if (soundPlayed) return;

    video.muted = true;
    setAutoplayBlocked(true);

    try {
      await video.play();
    } catch {
      setNeedsInteraction(true);
    }
  }, [playWithSound]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const startOnce = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      startPlayback();
    };

    if (video.readyState >= 2) {
      startOnce();
    } else {
      video.addEventListener('canplay', startOnce, { once: true });
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') finishRef.current?.();
    };
    window.addEventListener('keydown', handleKeydown);

    return () => {
      video.removeEventListener('canplay', startOnce);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [startPlayback]);

  useEffect(() => {
    if (!videoError) return undefined;
    const timer = window.setTimeout(() => finishRef.current?.(), 2200);
    return () => window.clearTimeout(timer);
  }, [videoError]);

  const handleTimeUpdate = (event) => {
    const video = event.currentTarget;
    const total = video.duration || 0;
    setProgress(total ? Math.min((video.currentTime / total) * 100, 100) : 0);
    if (total && total !== duration) setDuration(total);
  };

  const handleManualPlay = async () => {
    setNeedsInteraction(false);
    const soundPlayed = await playWithSound();

    if (soundPlayed) return;

    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    setAutoplayBlocked(true);

    try {
      await video.play();
    } catch {
      setVideoError(true);
    }
  };

  const enableSound = async () => {
    const played = await playWithSound();
    if (!played) {
      setAutoplayBlocked(true);
    }
  };

  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (soundEnabled) {
      video.muted = true;
      setSoundEnabled(false);
      setAutoplayBlocked(false);
      return;
    }

    await enableSound();
  };

  return (
    <div className={`tp-boot ${isLeaving ? 'is-leaving' : ''}`.trim()}>
      <video
        ref={videoRef}
        className="tp-boot__video"
        src="/boot.mp4"
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={onFinish}
        onError={() => setVideoError(true)}
        aria-label="Testing Platform 启动动画"
      />

      <div className="tp-boot__shade" />
      <div className="tp-boot__grain" />

      <header className="tp-boot__hud tp-boot__hud--top">
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 w-10 text-acid" />
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.18em] text-paper">
              TESTING / PLATFORM
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.28em] text-white/50">
              Quality engineering control plane
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-6 font-mono text-[9px] uppercase tracking-[0.24em] text-white/50 sm:flex">
            <span>BOOT SEQ · 2.4.0</span>
            <span className="flex items-center gap-2 text-acid">
              <i className="h-1.5 w-1.5 rounded-full bg-acid animate-pulse-soft" />
              Live feed
            </span>
          </div>

          {!videoError && (
            <button
              type="button"
              className={`tp-boot__sound ${soundEnabled ? 'is-on' : ''}`.trim()}
              onClick={toggleSound}
              aria-label={soundEnabled ? '关闭启动动画声音' : '开启启动动画声音'}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? <IconSound /> : <IconMute />}
              <span>{soundEnabled ? 'SOUND ON' : 'SOUND OFF'}</span>
            </button>
          )}
        </div>
      </header>

      <div className="tp-boot__reticle" aria-hidden="true">
        <span className="tp-boot__reticle-ring" />
        <span className="tp-boot__reticle-cross" />
        <span className="absolute left-1/2 top-1/2 h-px w-24 -translate-x-1/2 bg-white/20" />
        <span className="absolute left-1/2 top-1/2 h-24 w-px -translate-y-1/2 bg-white/20" />
      </div>

      <div className="tp-boot__center">
        {needsInteraction && !videoError && (
          <Button
            type="primary"
            className="btn-acid"
            icon={<IconArrowRight />}
            onClick={handleManualPlay}
          >
            开始启动序列
          </Button>
        )}
        {videoError && (
          <div className="flex items-center gap-2 border border-white/15 bg-black/40 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 backdrop-blur-md">
            <IconLoading spin />
            Boot asset offline · entering console
          </div>
        )}
      </div>

      {autoplayBlocked && !soundEnabled && !needsInteraction && !videoError && (
        <div className="tp-boot__sound-callout" role="status">
          <span className="tp-boot__sound-callout__icon">
            <IconMute />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-acid">
              Audio awaiting activation
            </p>
            <p className="mt-1 text-[11px] leading-5 text-white/60">
              浏览器限制带声音自动播放，点击即可同步开启音轨。
            </p>
          </div>
          <button type="button" onClick={enableSound} className="tp-boot__sound-action">
            <IconSound />
            开启声音
          </button>
        </div>
      )}

      <footer className="tp-boot__hud tp-boot__hud--bottom">
        <div className="w-full max-w-[560px]">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/45">
                System initialization
              </p>
              <p className="mt-1 font-display text-xs tracking-[0.08em] text-white/90">
                INITIALIZING CONTROL ENVIRONMENT
              </p>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-acid">
              {Math.round(progress).toString().padStart(3, '0')}%
            </span>
          </div>
          <div className="relative h-[3px] overflow-hidden bg-white/15">
            <span
              className="absolute inset-y-0 left-0 bg-acid transition-[width] duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
            <span className="tp-boot__scan" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
            <span>SECURE CHANNEL / AES-256</span>
            <button type="button" className="tp-boot__skip" onClick={onFinish}>
              跳过动画 <IconArrowRight />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
