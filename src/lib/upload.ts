import { fetchWithAuth } from './api';

export async function uploadFilesToSeaweed(files: File[], entityId: string, entityType: string, onProgress?: (progress: number) => void): Promise<void> {
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // 1. Get Presigned URL
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
      throw new Error(`Failed to upload ${file.name} to SeaweedFS`);
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
      }),
    });

    if (onProgress) {
      onProgress(((i + 1) / files.length) * 100);
    }
  }
}
