export interface SharedFile {
  id: string;
  filename: string;
  storagePath: string;
  downloadUrl: string;
  uploadedAt: number; // millisecond timestamp
  expiresAt: number;   // millisecond timestamp
  size: number;
  mimeType: string;
  uploaderUid: string;
  isText?: boolean;
  textContent?: string;
}

export interface ActiveUpload {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  cancel?: () => void;
  retry?: () => void;
  file: File;
}

export type SortField = 'newest' | 'oldest' | 'name' | 'size' | 'type';
export type Theme = 'light' | 'dark';
