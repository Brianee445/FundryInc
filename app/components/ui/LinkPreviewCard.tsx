'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';
import type { LinkPreview } from '@/app/lib/types/founderProfile';

export function LinkPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

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
      className="flex overflow-hidden rounded-card border border-borderColor bg-secondaryBg transition hover:border-primaryBlue"
    >
      {preview.image && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts, next/image would need a wildcard remotePatterns config
        <img src={preview.image} alt="" className="h-24 w-24 shrink-0 object-cover" />
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
