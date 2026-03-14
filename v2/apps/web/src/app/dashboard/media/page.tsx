'use client';

import { useEffect, useState, useCallback } from 'react';
import { mediaApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, EmptyState } from '@/components/ui/spinner';
import { formatRelative } from '@/lib/utils';
import { toast } from 'sonner';

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await mediaApi.list({ page });
      setMedia(page === 1 ? res.media : (prev: any[]) => [...prev, ...res.media]);
      setTotal(res.total);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadRes = await mediaApi.getUploadUrl({
          filename: file.name,
          content_type: file.type,
        });
        await fetch(uploadRes.upload_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        await mediaApi.register({
          s3_key: uploadRes.s3_key || uploadRes.key,
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
        });
      }
      toast.success(`Uploaded ${files.length} file(s)`);
      setPage(1);
      setLoading(true);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media file?')) return;
    try {
      await mediaApi.delete(id);
      setMedia((prev) => prev.filter((m) => m.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading && page === 1) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            <span className="font-mono text-foreground">{total}</span> files · Upload images and videos for your agents
          </p>
        </div>
        <div>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleUpload}
            className="hidden"
            id="media-upload"
          />
          <Button variant="glow" asChild disabled={uploading}>
            <label htmlFor="media-upload" className="cursor-pointer">
              {uploading ? <Spinner size="sm" /> : '+ Upload Media'}
            </label>
          </Button>
        </div>
      </div>

      {media.length === 0 ? (
        <EmptyState
          icon="▣"
          title="No media uploaded"
          description="Upload images and videos to use in your agent posts."
          action={
            <Button variant="glow" asChild>
              <label htmlFor="media-upload" className="cursor-pointer">Upload Media</label>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {media.map((item, i) => (
              <div
                key={item.id}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.12] transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="aspect-square bg-white/[0.02] relative">
                  {item.content_type?.startsWith('image/') ? (
                    <img
                      src={item.url}
                      alt={item.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-muted-foreground">▶</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs truncate font-medium">{item.original_filename}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{formatRelative(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          {media.length < total && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
