'use client';

import { useRef, useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { apiUpload, ApiError } from '@/app/lib/api';

interface MediaUploadResponse {
  url: string;
}

const MAX_IMAGES = 6;

export function GalleryUploadField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setError(null);
    const remaining = MAX_IMAGES - value.length;
    if (remaining <= 0) {
      setError(`Up to ${MAX_IMAGES} images allowed — remove one first.`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append('kind', 'gallery');
        formData.append('file', file);
        const result = await apiUpload<MediaUploadResponse>('/api/v1/media/upload', formData);
        uploaded.push(result.url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-secondaryText">
        Startup Images ({value.length}/{MAX_IMAGES})
      </label>

      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {value.map((src, index) => (
            <div key={src} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-20 w-full rounded-input border border-borderColor object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-1 top-1 rounded-full bg-error px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={uploading || value.length >= MAX_IMAGES}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading...' : 'Add Images'}
      </Button>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
