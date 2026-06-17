import { useState, useRef } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon, Map, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
}

export function FileUploader({ 
  label = "Anexar Arquivos",
  maxFiles = undefined,
  accept = ".png,.jpg,.jpeg,.pdf,.docx,.doc,.kml,.kmz,.geojson",
  onChange
}: { 
  label?: string;
  maxFiles?: number;
  accept?: string;
  onChange?: (files: File[]) => void;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Handle max files constraint
      if (maxFiles && attachments.length + selectedFiles.length > maxFiles) {
        alert(`Você só pode anexar no máximo ${maxFiles} arquivo(s) neste campo.`);
        return;
      }

      const newFiles = selectedFiles.map((file) => {
        let previewUrl = '';
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }
        return {
          id: Math.random().toString(36).substring(7),
          file,
          previewUrl,
        };
      });
      const newAttachments = [...attachments, ...newFiles];
      setAttachments(newAttachments);
      if (onChange) onChange(newAttachments.map(a => a.file));
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const filtered = prev.filter(a => a.id !== id);
      const removed = prev.find(a => a.id === id);
      if (removed && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      if (onChange) onChange(filtered.map(a => a.file));
      return filtered;
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-blue-400" />;
    if (file.type === 'application/pdf') return <FileText className="h-6 w-6 text-red-400" />;
    if (file.name.endsWith('.kml') || file.name.endsWith('.kmz') || file.name.endsWith('.geojson')) return <Map className="h-6 w-6 text-emerald-400" />;
    if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) return <FileText className="h-6 w-6 text-blue-500" />;
    return <File className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <div className="space-y-3">
      <Label>{label} <span className="text-xs text-muted-foreground font-normal">(Imagens, PDF, DOCX, KML)</span></Label>
      
      {/* Only show the dropzone if we haven't reached the maxFiles limit */}
      {(!maxFiles || attachments.length < maxFiles) && (
        <div 
          className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-secondary/10 hover:bg-secondary/20 transition-colors cursor-pointer text-center"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Clique para selecionar ou arraste os arquivos aqui</p>
          <p className="text-xs text-muted-foreground mt-1">
            {accept.includes('pdf') ? 'PNG, JPEG, PDF, DOCX, KML suportados' : 'Apenas imagens (PNG, JPEG) suportadas'}
          </p>
          <input 
            type="file" 
            multiple={!maxFiles || maxFiles > 1} 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept={accept}
          />
        </div>
      )}

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {attachments.map((att) => (
            <div key={att.id} className="relative group rounded-lg overflow-hidden border border-border bg-card/50">
              {att.previewUrl ? (
                <div 
                  className="w-full h-24 bg-black/20 cursor-pointer" 
                  onClick={() => setFullscreenImage(att.previewUrl)}
                >
                  <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-24 flex flex-col items-center justify-center bg-secondary/30 p-2 text-center">
                  {getFileIcon(att.file)}
                  <span className="text-[10px] mt-2 font-mono truncate w-full px-2" title={att.file.name}>
                    {att.file.name}
                  </span>
                </div>
              )}
              
              {/* Delete Button */}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAttachment(att.id); }}
                className="absolute top-1 right-1 bg-black/60 hover:bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={fullscreenImage} 
            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl border border-white/10" 
            alt="Fullscreen preview" 
          />
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
