import React, { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchWithAuth } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AttachmentUploaderProps {
  entityId: string;
  entityType: string;
  onUploadComplete?: () => void;
}

export function AttachmentUploader({ entityId, entityType, onUploadComplete }: AttachmentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1. Get Presigned URL
        // Using correct context path /api/v1/attachments according to Traefik
        const presignedRes = await fetchWithAuth(`/attachments/upload-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`);

        // 2. Upload file directly to SeaweedFS using the presigned URL
        const uploadRes = await fetch(presignedRes.url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload to SeaweedFS');
        }

        // 3. Confirm upload with Attachment Service
        await fetchWithAuth('/attachments/confirm', {
          method: 'POST',
          body: JSON.stringify({
            fileKey: presignedRes.fileKey,
            fileName: file.name,
            contentType: file.type,
            sizeBytes: file.size,
            entityId,
            entityType,
            // gpsLat: ..., gpsLng: ... could be extracted here from EXIF
          }),
        });

        setProgress(((i + 1) / files.length) * 100);
      }

      toast({
        title: 'Upload Concluído',
        description: `${files.length} arquivo(s) enviado(s) com sucesso.`,
      });

      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível enviar os arquivos. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-background/50 border-border">
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-6 hover:bg-secondary/10 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Clique para selecionar arquivos</p>
        <p className="text-xs text-muted-foreground mt-1">Imagens, vídeos ou documentos</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          multiple 
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Arquivos selecionados:</p>
          <ul className="space-y-2">
            {files.map((file, i) => (
              <li key={i} className="flex items-center justify-between bg-secondary/20 p-2 rounded text-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-fire" /> : <File className="h-4 w-4 text-command" />}
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFile(i)} disabled={uploading}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="pt-2 flex flex-col gap-2">
            {uploading && (
              <div className="w-full bg-secondary rounded-full h-2.5">
                <div className="bg-fire h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            )}
            <Button onClick={handleUpload} disabled={uploading} className="w-full bg-fire hover:bg-fire/90 text-white">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando ({progress.toFixed(0)}%)
                </>
              ) : (
                'Fazer Upload'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
