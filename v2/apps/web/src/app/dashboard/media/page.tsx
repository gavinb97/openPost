'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { mediaApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner, EmptyState } from '@/components/ui/spinner';
import { formatRelative } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type FolderFilter = string | null | 'none'; // null=all, 'none'=unorganized, uuid=folder

interface MediaFolder {
  id: string;
  name: string;
  label: string | null;
  file_count: number;
  created_at: string;
}

interface MediaItem {
  id: string;
  original_name: string;
  mime_type: string;
  url: string;
  folder_id: string | null;
  created_at: string;
}

// ─── Folder Sidebar ───────────────────────────────────────────────────────────

interface FolderSidebarProps {
  folders: MediaFolder[];
  selectedFolder: FolderFilter;
  onSelect: (id: FolderFilter) => void;
  onFolderCreated: (f: MediaFolder) => void;
  onFolderUpdated: (f: MediaFolder) => void;
  onFolderDeleted: (id: string) => void;
  totalFiles: number;
  unorganizedCount: number;
}

function FolderSidebar({
  folders,
  selectedFolder,
  onSelect,
  onFolderCreated,
  onFolderUpdated,
  onFolderDeleted,
  totalFiles,
  unorganizedCount,
}: FolderSidebarProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const newNameRef = useRef<HTMLInputElement>(null);
  const editNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (creating) newNameRef.current?.focus(); }, [creating]);
  useEffect(() => { if (editingId) editNameRef.current?.focus(); }, [editingId]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await mediaApi.createFolder({ name, label: newLabel.trim() || undefined });
      onFolderCreated(res.folder);
      setCreating(false);
      setNewName('');
      setNewLabel('');
      toast.success('Folder created');
    } catch {
      toast.error('Failed to create folder');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await mediaApi.updateFolder(id, { name, label: editLabel.trim() || undefined });
      onFolderUpdated(res.folder);
      setEditingId(null);
      toast.success('Folder updated');
    } catch {
      toast.error('Failed to update folder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete folder "${name}"? Files will move to Unorganized.`)) return;
    try {
      await mediaApi.deleteFolder(id);
      onFolderDeleted(id);
      if (selectedFolder === id) onSelect(null);
      toast.success('Folder deleted');
    } catch {
      toast.error('Failed to delete folder');
    }
  };

  const startEdit = (f: MediaFolder) => {
    setEditingId(f.id);
    setEditName(f.name);
    setEditLabel(f.label || '');
  };

  const btnBase = 'flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors w-full text-left';
  const active = 'bg-white/[0.08] text-foreground font-medium';
  const inactive = 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground';

  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-1">
      {/* All Files */}
      <button onClick={() => onSelect(null)} className={`${btnBase} ${selectedFolder === null ? active : inactive}`}>
        <span className="flex items-center gap-2">
          <span>⊞</span>
          <span>All Files</span>
        </span>
        <span className="text-xs font-mono text-muted-foreground">{totalFiles}</span>
      </button>

      {/* Unorganized */}
      {unorganizedCount > 0 && (
        <button onClick={() => onSelect('none')} className={`${btnBase} ${selectedFolder === 'none' ? active : inactive}`}>
          <span className="flex items-center gap-2">
            <span className="text-amber-400/80">◈</span>
            <span>Unorganized</span>
          </span>
          <span className="text-xs font-mono text-amber-400/70">{unorganizedCount}</span>
        </button>
      )}

      {/* Divider */}
      {folders.length > 0 && <div className="border-t border-white/[0.06] my-1" />}

      {/* Folder list */}
      {folders.map((f) =>
        editingId === f.id ? (
          <div key={f.id} className="px-2 py-2 rounded-xl bg-white/[0.04] space-y-1.5">
            <input
              ref={editNameRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdate(f.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              placeholder="Folder name"
              className="w-full text-xs bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20"
            />
            <input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdate(f.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              placeholder="Label (optional)"
              className="w-full text-xs bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20"
            />
            <div className="flex gap-1.5">
              <Button size="sm" variant="glow" className="h-6 text-xs px-2 flex-1" onClick={() => handleUpdate(f.id)} disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={f.id}
            className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors ${
              selectedFolder === f.id ? active : inactive
            }`}
            onClick={() => onSelect(f.id)}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="flex-shrink-0">▣</span>
              <span className="truncate">{f.name}</span>
              {f.label && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 flex-shrink-0">
                  {f.label}
                </Badge>
              )}
            </span>
            <span className="flex items-center gap-1 flex-shrink-0 ml-1">
              <span className="text-xs font-mono text-muted-foreground group-hover:hidden">
                {f.file_count}
              </span>
              <span className="hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(f); }}
                  className="p-0.5 hover:text-foreground transition-colors"
                  title="Edit folder"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(f.id, f.name); }}
                  className="p-0.5 hover:text-destructive transition-colors"
                  title="Delete folder"
                >
                  ✕
                </button>
              </span>
            </span>
          </div>
        )
      )}

      {/* New folder form */}
      {creating ? (
        <div className="px-2 py-2 rounded-xl bg-white/[0.04] space-y-1.5 mt-1">
          <input
            ref={newNameRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setCreating(false); setNewName(''); setNewLabel(''); }
            }}
            placeholder="Folder name"
            className="w-full text-xs bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20"
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setCreating(false); setNewName(''); setNewLabel(''); }
            }}
            placeholder="Label (optional)"
            className="w-full text-xs bg-white/[0.06] border border-white/[0.10] rounded-lg px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20"
          />
          <div className="flex gap-1.5">
            <Button size="sm" variant="glow" className="h-6 text-xs px-2 flex-1" onClick={handleCreate} disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Create'}
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setCreating(false); setNewName(''); setNewLabel(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
        >
          <span>+</span>
          <span>New Folder</span>
        </button>
      )}
    </div>
  );
}

// ─── Media Card ───────────────────────────────────────────────────────────────

interface MediaCardProps {
  item: MediaItem;
  folders: MediaFolder[];
  index: number;
  showMoveFooter?: boolean;
  onDelete: (id: string) => void;
  onRenamed: (id: string, name: string) => void;
  onMoved: (id: string, folder_id: string | null) => void;
}

function MediaCard({ item, folders, index, showMoveFooter, onDelete, onRenamed, onMoved }: MediaCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(item.original_name);
  const [moving, setMoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (renaming) inputRef.current?.focus(); }, [renaming]);

  const saveRename = async () => {
    const name = nameVal.trim();
    if (!name || name === item.original_name) { setRenaming(false); return; }
    try {
      await mediaApi.renameFile(item.id, name);
      onRenamed(item.id, name);
      setRenaming(false);
      toast.success('File renamed');
    } catch {
      toast.error('Failed to rename');
      setNameVal(item.original_name);
      setRenaming(false);
    }
  };

  const handleMove = async (folder_id: string | null) => {
    setMoving(false);
    try {
      await mediaApi.moveFile(item.id, folder_id);
      onMoved(item.id, folder_id);
      toast.success(folder_id ? 'Moved to folder' : 'Moved to Unorganized');
    } catch {
      toast.error('Failed to move file');
    }
  };

  const isImage = item.mime_type?.startsWith('image/');
  const isVideo = item.mime_type?.startsWith('video/');

  return (
    <div
      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.12] transition-all duration-300 animate-fade-up"
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-black/20 relative overflow-hidden">
        {isImage ? (
          <img
            src={item.url}
            alt={item.original_name}
            className="w-full h-full object-cover"
          />
        ) : isVideo ? (
          <video
            src={item.url}
            preload="metadata"
            muted
            playsInline
            className="w-full h-full object-cover"
            onMouseEnter={(e) => { (e.currentTarget as HTMLVideoElement).play().catch(() => {}); }}
            onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-muted-foreground">
            ▶
          </div>
        )}

        {/* Video badge */}
        {isVideo && (
          <div className="absolute top-2 left-2 bg-black/60 rounded px-1.5 py-0.5 text-[9px] font-mono text-white/70 backdrop-blur-sm">
            VIDEO
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-3 gap-1.5 px-2">
          {/* Move to folder (hover) — only shown when NOT already showing footer move */}
          {!showMoveFooter && (
            <div className="relative w-full">
              {moving ? (
                <div className="absolute bottom-full mb-1 left-0 right-0 bg-zinc-900 border border-white/[0.10] rounded-xl overflow-hidden z-10 shadow-xl">
                  <button
                    onClick={() => handleMove(null)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Remove from folder
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handleMove(f.id)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <span>▣</span>
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="w-full h-6 text-[10px]"
                onClick={() => setMoving((v) => !v)}
              >
                Move to folder
              </Button>
            </div>
          )}

          <div className="flex gap-1.5 w-full">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-6 text-[10px]"
              onClick={() => setRenaming(true)}
            >
              Rename
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 h-6 text-[10px]"
              onClick={() => onDelete(item.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        {moving && !showMoveFooter && (
          <div className="fixed inset-0 z-[9]" onClick={() => setMoving(false)} />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 space-y-2">
        {renaming ? (
          <input
            ref={inputRef}
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename();
              if (e.key === 'Escape') { setRenaming(false); setNameVal(item.original_name); }
            }}
            onBlur={saveRename}
            className="w-full text-xs bg-white/[0.06] border border-white/[0.14] rounded-md px-1.5 py-0.5 text-foreground focus:outline-none focus:border-white/25"
          />
        ) : (
          <p
            className="text-xs truncate font-medium cursor-pointer hover:text-foreground/80 transition-colors"
            onClick={() => setRenaming(true)}
            title={item.original_name}
          >
            {item.original_name}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground font-mono">
          {formatRelative(item.created_at)}
        </p>

        {/* Persistent move-to-folder row for unorganized view */}
        {showMoveFooter && folders.length > 0 && (
          <div className="relative pt-1 border-t border-white/[0.05]">
            {moving ? (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-zinc-900 border border-white/[0.10] rounded-xl overflow-hidden z-10 shadow-xl">
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMove(f.id)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <span>▣</span>
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
            <button
              onClick={() => setMoving((v) => !v)}
              className="w-full flex items-center justify-between text-[10px] text-amber-400/70 hover:text-amber-400 transition-colors"
            >
              <span>Move to folder →</span>
              <span>▾</span>
            </button>
            {moving && (
              <div className="fixed inset-0 z-[9]" onClick={() => setMoving(false)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unorganizedCount, setUnorganizedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderFilter>(null);

  // Load folders on mount
  useEffect(() => {
    mediaApi.listFolders().then((res) => setFolders(res.folders)).catch(() => {});
  }, []);

  // Keep unorganized count fresh whenever we're not viewing unorganized
  const refreshUnorganizedCount = useCallback(async () => {
    try {
      const res = await mediaApi.list({ page: 1, limit: 1, folder_id: 'none' } as any);
      setUnorganizedCount(res.total);
    } catch {}
  }, []);

  useEffect(() => { refreshUnorganizedCount(); }, [refreshUnorganizedCount]);

  const load = useCallback(async (resetPage = false) => {
    const p = resetPage ? 1 : page;
    setLoading(true);
    try {
      const params: any = { page: p };
      if (selectedFolder === 'none') {
        params.folder_id = 'none';
      } else if (selectedFolder !== null) {
        params.folder_id = selectedFolder;
      }
      const res = await mediaApi.list(params);
      setMedia(p === 1 ? res.media : (prev) => [...prev, ...res.media]);
      setTotal(res.total);
      if (resetPage) setPage(1);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [page, selectedFolder]);

  useEffect(() => { load(); }, [load]);

  const handleSelectFolder = (id: FolderFilter) => {
    setSelectedFolder(id);
    setPage(1);
    setMedia([]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadRes = await mediaApi.getUploadUrl({
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          folder_id: (selectedFolder && selectedFolder !== 'none') ? selectedFolder : undefined,
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
          folder_id: (selectedFolder && selectedFolder !== 'none') ? selectedFolder : undefined,
        });
      }
      toast.success(`Uploaded ${files.length} file(s)`);
      load(true);
      refreshUnorganizedCount();
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
      setTotal((t) => t - 1);
      if (selectedFolder === 'none') setUnorganizedCount((c) => c - 1);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRenamed = (id: string, name: string) => {
    setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, original_name: name } : m)));
  };

  const handleMoved = (id: string, folder_id: string | null) => {
    if (selectedFolder !== null) {
      // Remove from current filtered view when file leaves it
      setMedia((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => t - 1);
      if (selectedFolder === 'none') setUnorganizedCount((c) => c - 1);
    } else {
      setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, folder_id } : m)));
    }
    refreshUnorganizedCount();
  };

  const activeFolder = folders.find((f) => f.id === selectedFolder);
  const isUnorganizedView = selectedFolder === 'none';

  const headingText = isUnorganizedView
    ? 'Unorganized'
    : activeFolder
    ? activeFolder.name
    : 'Media Library';

  const subText = isUnorganizedView
    ? `${total} files without a folder — move them to keep things tidy`
    : activeFolder
    ? `${total} files in this folder`
    : `${total} files · Upload images and videos for your agents`;

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar */}
      <div className="pt-1">
        <FolderSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelect={handleSelectFolder}
          totalFiles={total}
          unorganizedCount={unorganizedCount}
          onFolderCreated={(f) => setFolders((prev) => [...prev, f])}
          onFolderUpdated={(f) => setFolders((prev) => prev.map((x) => (x.id === f.id ? f : x)))}
          onFolderDeleted={(id) => { setFolders((prev) => prev.filter((x) => x.id !== id)); refreshUnorganizedCount(); }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              {isUnorganizedView && <span className="text-amber-400/80">◈</span>}
              {headingText}
            </h1>
            <p className="text-muted-foreground mt-1">
              {subText}
              {activeFolder?.label && (
                <Badge variant="secondary" className="ml-2 text-xs">{activeFolder.label}</Badge>
              )}
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

        {/* Grid */}
        {loading && media.length === 0 ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : media.length === 0 ? (
          <EmptyState
            icon={isUnorganizedView ? '◈' : '▣'}
            title={
              isUnorganizedView
                ? 'All files are organized!'
                : selectedFolder !== null
                ? 'No files in this folder'
                : 'No media uploaded'
            }
            description={
              isUnorganizedView
                ? 'Every file is in a folder. Nice work.'
                : selectedFolder !== null
                ? 'Upload files or move existing files here.'
                : 'Upload images and videos to use in your agent posts.'
            }
            action={
              !isUnorganizedView ? (
                <Button variant="glow" asChild>
                  <label htmlFor="media-upload" className="cursor-pointer">Upload Media</label>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {isUnorganizedView && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.03] px-4 py-3 text-sm text-amber-300/80">
                These files have no folder. Use the <span className="font-medium text-amber-300">Move to folder →</span> button on each card to organize them.
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {media.map((item, i) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  folders={folders}
                  index={i}
                  showMoveFooter={isUnorganizedView}
                  onDelete={handleDelete}
                  onRenamed={handleRenamed}
                  onMoved={handleMoved}
                />
              ))}
            </div>
            {media.length < total && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                  {loading ? <Spinner size="sm" /> : 'Load more'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
