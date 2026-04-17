'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Alert from '@/components/ui/Alert';
import { Upload, X, File, Image as ImageIcon, Check } from 'lucide-react';

interface ReceiptFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

export default function ReceiptUploader({
  expenseId,
  onUploadComplete,
}: {
  expenseId?: string;
  onUploadComplete?: (url: string, name: string) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ReceiptFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setError(null);
      const newFiles: ReceiptFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // Validate file type
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowed.includes(file.type)) {
          setError(`"${file.name}" is not a supported format. Use JPEG, PNG, WebP, or PDF.`);
          continue;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          setError(`"${file.name}" exceeds the 10MB limit.`);
          continue;
        }

        const id = crypto.randomUUID();
        const isImage = file.type.startsWith('image/');
        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

        newFiles.push({
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl,
          status: 'uploading',
        });

        // Upload to API
        const formData = new FormData();
        formData.append('file', file);
        if (expenseId) formData.append('expense_id', expenseId);

        fetch('/api/receipts/upload', {
          method: 'POST',
          body: formData,
        })
          .then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || 'Upload failed');
            }
            const data = await res.json();
            setFiles((prev) =>
              prev.map((f) =>
                f.id === id ? { ...f, status: 'done' as const } : f,
              ),
            );
            if (onUploadComplete && data.url) {
              onUploadComplete(data.url, file.name);
            }
            if (expenseId) {
              router.refresh();
            }
          })
          .catch((err) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === id
                  ? { ...f, status: 'error' as const, error: err.message }
                  : f,
              ),
            );
          });
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [expenseId, onUploadComplete, router],
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragOver
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-border hover:border-brand-primary/50 hover:bg-bg-secondary/50'
        }`}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-text-muted" />
        <p className="text-sm font-medium text-foreground">
          Drop receipts here or click to browse
        </p>
        <p className="mt-1 text-xs text-text-muted">
          JPEG, PNG, WebP, or PDF • Max 10MB per file
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {error && <Alert>{error}</Alert>}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
            >
              {/* Thumbnail / icon */}
              {file.previewUrl ? (
                <Image
                  src={file.previewUrl}
                  alt={file.name}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 rounded object-cover"
                />
              ) : file.type === 'application/pdf' ? (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-red-500/10">
                  <File size={20} className="text-red-600" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-50">
                  <ImageIcon size={20} className="text-blue-600" />
                </div>
              )}

              {/* Metadata */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-text-muted">
                  {formatSize(file.size)}
                  {file.status === 'uploading' && (
                    <span className="ml-2 text-blue-600">Uploading…</span>
                  )}
                  {file.status === 'done' && (
                    <span className="ml-2 text-green-600">Uploaded</span>
                  )}
                  {file.status === 'error' && (
                    <span className="ml-2 text-red-600">
                      Failed: {file.error || 'Failed'}
                    </span>
                  )}
                </p>
              </div>

              {/* Status / actions */}
              <div className="flex items-center gap-2 shrink-0">
                {file.status === 'uploading' && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                )}
                {file.status === 'done' && (
                  <Check size={16} className="text-green-600" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="rounded p-1 text-text-muted hover:text-foreground hover:bg-bg-secondary transition-colors"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
