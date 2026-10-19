import { API_ENDPOINTS } from './constants';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface PresignedURLResponse {
  upload_id: string;
  presigned_url: string;
  s3_key: string;
  expires_at: string;
}

export interface ConfirmUploadRequest {
  upload_id: string;
  s3_key: string;
  sha256_hash: string;
  file_size_bytes: number;
  exif_data?: Record<string, unknown>;
}

export class C2CClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
  }

  public setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error [${response.status}]: ${errorBody}`);
    }

    return response.json();
  }

  public async getHealth() {
    return this.request<{ status: string; timestamp: string }>(API_ENDPOINTS.HEALTH);
  }

  public async requestPresignedURL(payload: {
    session_id: string;
    filename: string;
    file_size_bytes: number;
    mime_type: string;
  }): Promise<PresignedURLResponse> {
    return this.request<PresignedURLResponse>(API_ENDPOINTS.UPLOADS_REQUEST_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async confirmUpload(payload: ConfirmUploadRequest) {
    return this.request(API_ENDPOINTS.UPLOADS_CONFIRM, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const c2cClient = new C2CClient();
