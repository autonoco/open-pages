import { useEffect, useRef, useState } from 'react';
import { frameUrl } from './lib/frame';
import { loadPage, pageIds, pageKinds } from './lib/pages';

export default function GalleryCapture() {
  const id = new URLSearchParams(window.location.search).get('id');
  const [title, setTitle] = useState(id ?? '');
  const [error, setError] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState<string>();
  const [metadataReady, setMetadataReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!id) return;
    let active = true;
    loadPage(id)
      .then((value) => {
        if (active) {
          setTitle(value.meta?.title ?? id);
          setMetadataReady(true);
        }
      })
      .catch((cause) => {
        if (active) setError(String(cause));
      });
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    let active = true;
    const ready = async () => {
      const frame = frameRef.current?.contentDocument;
      if (!frame) throw new Error('Page preview unavailable');
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await frame.fonts.ready;
      if (active) setLoaded(true);
    };
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow
      )
        return;
      if (event.data?.type === 'op:error') setError(String(event.data.message));
      if (event.data?.type === 'op:ready')
        ready().catch((cause) => {
          if (active) setError(String(cause));
        });
    };
    window.addEventListener('message', receive);
    if (id) setSrc(frameUrl({ pageId: id, kind: pageKinds[id] }));
    return () => {
      active = false;
      window.removeEventListener('message', receive);
    };
  }, [id]);
  if (!id)
    return (
      <div data-document-index={JSON.stringify({ version: 1, kind: 'pages', ids: pageIds })} />
    );
  return (
    <div
      className="h-svh w-full"
      data-document-title={title}
      data-document-count="1"
      data-document-ready={loaded && metadataReady && !error ? '' : undefined}
      data-document-error={error ?? undefined}
    >
      <iframe
        ref={frameRef}
        title={title}
        className="h-full w-full"
        src={src}
        onLoad={(event) => {
          if (pageKinds[id] !== 'html' || !src) return;
          const iframe = event.currentTarget;
          try {
            const frame = iframe.contentDocument;
            if (frame?.URL === 'about:blank') return;
            if (!frame || frame.URL !== new URL(src, window.location.href).href)
              throw new Error('Page preview navigation failed');
            const navigation = iframe.contentWindow?.performance.getEntriesByType(
              'navigation',
            )[0] as PerformanceNavigationTiming | undefined;
            const status = navigation?.responseStatus;
            if (status === undefined || (status !== 304 && (status < 200 || status >= 300)))
              throw new Error(`Page preview navigation failed (HTTP ${status ?? 'unknown'})`);
            frame.fonts.ready
              .then(() => {
                if (iframe.contentDocument === frame) setLoaded(true);
              })
              .catch((cause) => setError(String(cause)));
          } catch (cause) {
            setError(String(cause));
          }
        }}
      />
    </div>
  );
}
