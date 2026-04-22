import { useEffect, useRef } from 'react';

/**
 * Pre-decodes /click.mp3 into a Web Audio AudioBuffer on mount so playback
 * is truly instantaneous — no per-click fetch/decode lag.
 */
export function useClickSound(enabled: boolean = true) {
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Create AudioContext and pre-load the decoded buffer
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    fetch('/click.mp3')
      .then((res) => res.arrayBuffer())
      .then((raw) => ctx.decodeAudioData(raw))
      .then((decoded) => {
        bufferRef.current = decoded;
      })
      .catch((err) => console.warn('[useClickSound] failed to load:', err));

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (!target.closest('button, a, [data-clicksound]')) return;

      const buffer = bufferRef.current;
      const context = ctxRef.current;
      if (!buffer || !context) return;

      // Resume suspended context (browser autoplay policy)
      if (context.state === 'suspended') {
        void context.resume();
      }

      // BufferSource plays instantly — no I/O or decode on the hot path
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 1.5; // plays ~33% shorter / snappier

      const gainNode = context.createGain();
      gainNode.gain.value = 0.6;

      source.connect(gainNode);
      gainNode.connect(context.destination);
      source.start(context.currentTime); // immediate, sample-accurate
    };

    window.addEventListener('click', handleClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleClick, { capture: true });
      void ctx.close();
      ctxRef.current = null;
      bufferRef.current = null;
    };
  }, [enabled]);
}
