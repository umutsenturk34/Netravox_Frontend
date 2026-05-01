import { useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function MediaPickerModal({ open, onClose, onSelect }) {
  const { activeTenantId } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['media', activeTenantId],
    queryFn: () => api.get('/media?limit=80').then((r) => r.data),
    enabled: !!activeTenantId && open,
  });

  const items = data?.data || [];

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('file', file);
      const { data: res } = await api.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res;
    },
    onSuccess: (uploaded) => {
      qc.invalidateQueries({ queryKey: ['media', activeTenantId] });
      if (uploaded?.url) setSelected(uploaded.url);
    },
  });

  const handleFiles = useCallback(async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync(file);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [uploadMutation]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const confirm = (url) => {
    const finalUrl = url ?? selected;
    if (!finalUrl) return;
    onSelect(finalUrl);
    setSelected(null);
    onClose();
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  const footer = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-muted)' }}
      >
        {uploading
          ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Yükleniyor…</>
          : '+ Yükle'}
      </button>

      {selected && (
        <span className="text-xs truncate flex-1 min-w-0" style={{ color: 'var(--text-muted)' }}>
          {selected.split('/').pop()}
        </span>
      )}

      <button
        onClick={handleClose}
        className="text-sm px-3 py-2 rounded-lg border ml-auto transition-colors"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        İptal
      </button>
      <button
        onClick={() => confirm()}
        disabled={!selected}
        className="text-sm px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-40"
        style={{ background: 'var(--primary)', color: '#fff' }}
      >
        ✓ Uygula
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Medya Seç" size="xl" footer={footer}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/mp4"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Drag & drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="rounded-lg border-2 border-dashed mb-4 p-2.5 text-center text-xs transition-colors"
        style={{
          borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
          color: 'var(--text-muted)',
          background: dragOver ? 'var(--bg-muted)' : 'transparent',
        }}
      >
        Görselleri buraya sürükleyip bırakabilirsin
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg animate-pulse" style={{ background: 'var(--bg-muted)' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="py-14 text-center text-sm cursor-pointer rounded-lg border-2 border-dashed hover:opacity-70 transition-opacity"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <p className="text-2xl mb-2">📁</p>
          <p>Henüz medya yok. Tıkla veya sürükle-bırak ile yükle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {uploading && (
            <div className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: 'var(--primary)', background: 'var(--bg-muted)' }}>
              <span className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
            </div>
          )}
          {items.map((item) => {
            const isSelected = selected === item.url;
            return (
              <button
                key={item._id}
                onClick={() => setSelected(isSelected ? null : item.url)}
                onDoubleClick={() => confirm(item.url)}
                className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all focus:outline-none"
                style={{
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                  background: 'var(--bg-muted)',
                }}
                title="Çift tıkla hızlı seç"
              >
                {item.mimeType?.startsWith('image/') ? (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.originalName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                )}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(37,99,235,0.35)' }}>
                    <span className="text-white text-lg font-bold drop-shadow">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
