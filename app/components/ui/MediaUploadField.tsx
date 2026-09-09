'use client';

import { useRef, useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { apiUpload, ApiError } from '@/app/lib/api';

interface MediaUploadResponse {
  url: string;
}

type Kind = 'profile_picture' | 'demo_video';

const ACCEPT_BY_KIND: Record<Kind, string> = {
  profile_picture: 'image/jpeg,image/png,image/webp,image/gif',
  demo_video: 'video/mp4,video/webm,video/quicktime',
};

export function MediaUploadField({
  kind,
  value,
  onChange,
  label,
}: {
  kind: Kind;
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('kind', kind);
      formData.append('file', file);
      const result = await apiUpload<MediaUploadResponse>('/api/v1/media/upload', formData);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-secondaryText">{label}</label>

      {kind === 'profile_picture' && value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mb-2 h-16 w-16 rounded-full border border-borderColor object-cover" />
      )}
      {kind === 'demo_video' && value && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={value} controls className="mb-2 h-32 w-full rounded-input border border-borderColor object-cover" />
      )}

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_BY_KIND[kind]}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading...' : value ? 'Replace' : 'Upload'}
        </Button>
        {value && !uploading && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
            Remove
          </Button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
