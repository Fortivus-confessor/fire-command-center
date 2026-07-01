import { fetchWithAuth } from "./api";
import { getKeycloak } from "../contexts/AuthContext";

export async function uploadFilesToSeaweed(
  files: File[],
  entityId: string,
  entityType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  if (!files || files.length === 0) return;

  const kc = await getKeycloak();
  const token = kc ? kc.token : "";

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // 1. Get Presigned URL directly without /combate prefix
    const presignedRes = await fetch(
      `/api/v1/attachments/upload-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    ).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

    // 2. Upload file directly to SeaweedFS using the presigned URL
    const uploadRes = await fetch(presignedRes.url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload ${file.name} to SeaweedFS`);
    }

    // 3. Confirm upload with Attachment Service
    await fetch("/api/v1/attachments/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
