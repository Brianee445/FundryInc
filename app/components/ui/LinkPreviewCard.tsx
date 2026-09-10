'use client';

import { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/app/lib/api';
import type { LinkPreview } from '@/app/lib/types/founderProfile';

// How long we give the iframe to report back before assuming the target
// site blocks framing (X-Frame-Options / CSP frame-ancestors) and falling
// back to the static OG image. This is a heuristic, not a real detection —
// see LiveSitePreview below for why a reliable check isn't possible here.
const LIVE_PREVIEW_TIMEOUT_MS = 3000;

/**
 * Simulates someone scrolling the target site: an oversized iframe, panned
 * up and back down via a CSS animation on the wrapping element. This is a
 * pure visual trick — cross-origin security rules mean we can never touch
 * the embedded page's own JS or scroll position, so this doesn't actually
 * drive the site, it just moves the whole iframe element within a clipped
 * viewport. That also means we can't reliably tell when a site refuses to
 * be framed at all (no dependable error event fires for that); the
 * `onLoad` + timeout race below is a best-effort guess, not a guarantee —
 * some blocked sites will still flash blank before the fallback kicks in.
 */
function LiveSitePreview({ url, onBlocked }: { url: string; onBlocked: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const timedOut = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) {
        timedOut.current = true;
        onBlocked();
      }
    }, LIVE_PREVIEW_TIMEOUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-40 w-full overflow-hidden bg-secondaryBg">
      <iframe
        src={url}
        title=""
        tabIndex={-1}
        sandbox="allow-same-origin allow-scripts"
        loading="lazy"
        onLoad={() => {
          if (!timedOut.current) setLoaded(true);
        }}
        className="pointer-events-none absolute left-0 top-0 origin-top-left animate-preview-scroll border-0"
        style={{ width: '400%', height: '400%', transform: 'scale(0.25)' }}
      />
    </div>
  );
}

export function LinkPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveBlocked, setLiveBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setLiveBlocked(false);

    apiGet<LinkPreview>(`/api/v1/link-preview?url=${encodeURIComponent(url)}`)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return <div className="h-24 w-full animate-pulse rounded-card bg-secondaryBg" />;
  }

  // Fetch failed or the page had no OG tags worth showing — fall back to a
  // plain link rather than an empty/broken card.
  if (failed || !preview || (!preview.title && !preview.image)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block truncate rounded-card border border-borderColor bg-secondaryBg px-4 py-3 text-sm text-primaryBlue hover:underline"
      >
        {url}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-card border border-borderColor bg-secondaryBg transition hover:border-primaryBlue"
    >
      {!liveBlocked ? (
        <LiveSitePreview url={url} onBlocked={() => setLiveBlocked(true)} />
      ) : (
        preview.image && (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts, next/image would need a wildcard remotePatterns config
          <img src={preview.image} alt="" className="h-40 w-full object-cover" />
        )
      )}
      <div className="min-w-0 flex-1 px-4 py-3">
        {preview.site_name && (
          <p className="truncate text-xs uppercase tracking-wide text-secondaryText">{preview.site_name}</p>
        )}
        <p className="truncate text-sm font-semibold text-primaryText">{preview.title ?? url}</p>
        {preview.description && (
          <p className="mt-1 line-clamp-2 text-xs text-secondaryText">{preview.description}</p>
        )}
      </div>
    </a>
  );
}
