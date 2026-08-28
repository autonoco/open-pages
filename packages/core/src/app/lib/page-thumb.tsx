import { useEffect, useRef, useState } from 'react';
import { type FrameSource, frameUrl } from './frame';

const THUMB_VIEWPORT = 1280;

/**
 * Live page preview for cards: the real page in an iframe laid out at a
 * desktop width and scaled down to fit. Inert — pointer events go to the
 * card, and the frame never takes focus.
 */
export function PageThumb({ source, title }: { source: FrameSource; title: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = size.width > 0 ? size.width / THUMB_VIEWPORT : 0;

  return (
    <div ref={ref} className="h-full w-full overflow-hidden bg-white">
      {scale > 0 && (
        <iframe
          title={title}
          src={frameUrl(source)}
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none origin-top-left border-0"
          style={{
            width: THUMB_VIEWPORT,
            height: size.height / scale,
            transform: `scale(${scale})`,
          }}
        />
      )}
    </div>
  );
}
