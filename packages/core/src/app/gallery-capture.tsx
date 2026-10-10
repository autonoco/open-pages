import { useEffect, useRef, useState } from 'react';
import { frameUrl } from './lib/frame';
import { loadPage, pageIds, pageKinds } from './lib/pages';

export default function GalleryCapture() {
  const id = new URLSearchParams(window.location.search).get('id');
  const [title, setTitle] = useState(id ?? '');
  const [error, setError] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
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
    return () => {
      active = false;
      window.removeEventListener('message', receive);
    };
  }, []);
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
        src={frameUrl({ pageId: id, kind: pageKinds[id] })}
        onLoad={(event) => {
          if (pageKinds[id] !== 'html') return;
          const frame = event.currentTarget.contentDocument;
          if (!frame) {
            setError('Page preview unavailable');
            return;
          }
          frame.fonts.ready.then(() => setLoaded(true)).catch((cause) => setError(String(cause)));
        }}
      />
    </div>
  );
}
