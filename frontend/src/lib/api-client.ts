const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface PresignedURLResponse {
  photo_id: string;
  upload_task_id: string;
  presigned_url: string;
  s3_key: string;
  already_uploaded: boolean;
  storage_provider?: string;
  gdrive_folder_id?: string;
  gdrive_file_id?: string;
  gdrive_view_link?: string;
}

export interface PhotoRecord {
  id: string;
  session_id: string;
  original_filename: string;
  file_format: string;
  file_size_bytes: number;
  sha256_hash: string;
  s3_bucket: string;
  s3_key_original: string;
  storage_provider?: string;
  gdrive_file_id?: string;
  gdrive_view_link?: string;
  preview_url?: string;
  thumbnail_url?: string;
  camera_make?: string;
  camera_model?: string;
  lens_model?: string;
  focal_length_mm?: number;
  aperture_f_stop?: number;
  shutter_speed_str?: string;
  iso_speed?: number;
  upload_status: string;
  created_at: string;
  updated_at: string;
}

export interface ShootSession {
  id: string;
  project_id: string;
  title: string;
  session_date: string;
  location: string;
  is_live: boolean;
  created_at: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  client_name: string;
  storage_folder_prefix: string;
  is_active: boolean;
}

export interface AgentStatusResponse {
  status: 'online' | 'offline';
  is_running: boolean;
  agent_id: string;
  agent_name?: string;
  active_session_id?: string;
  active_project_id?: string;
  watch_path?: string;
  adapter_id?: string;
  adapter_name?: string;
  message?: string;
  queue_summary?: {
    total: number;
    completed: number;
    uploading: number;
    retrying: number;
    queued: number;
  };
}

export interface QueueTask {
  id: string;
  photo: {
    file_path: string;
    file_name: string;
    extension: string;
    size_bytes: number;
    sha256_hash: string;
    discovered_at: string;
  };
  session_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying' | 'duplicate_skipped';
  retry_count: number;
  max_retries: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export class C2CClient {
  private baseURL: string;

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

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
    return this.request<{ status: string; service: string }>('/health');
  }

  public async getProjects(): Promise<ProjectRecord[]> {
    return this.request<ProjectRecord[]>('/projects');
  }

  public async getSessions(projectID: string = ''): Promise<ShootSession[]> {
    const query = projectID ? `?project_id=${encodeURIComponent(projectID)}` : '';
    return this.request<ShootSession[]>(`/sessions${query}`);
  }

  public async createSession(payload: { project_id: string; title: string; location: string }): Promise<ShootSession> {
    return this.request<ShootSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getPhotos(sessionID: string): Promise<PhotoRecord[]> {
    const query = sessionID ? `?session_id=${encodeURIComponent(sessionID)}` : '';
    return this.request<PhotoRecord[]>(`/photos${query}`);
  }

  public async getAgentStatus(): Promise<AgentStatusResponse> {
    return this.request<AgentStatusResponse>('/agent/status');
  }

  public async getAgentQueue(): Promise<{ tasks: QueueTask[]; total: number }> {
    return this.request<{ tasks: QueueTask[]; total: number }>('/agent/queue');
  }

  public async startAgentSync(payload: { watch_path?: string; session_id?: string; project_id?: string; adapter_id?: string }) {
    return this.request<{ status: string; message: string }>('/agent/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async stopAgentSync() {
    return this.request<{ status: string; message: string }>('/agent/stop', {
      method: 'POST',
    });
  }

  public async updateAgentConfig(payload: { watch_path?: string; session_id?: string; project_id?: string; adapter_id?: string }) {
    return this.request<{ status: string }>('/agent/config', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getGDriveStatus(): Promise<{
    provider: string;
    root_folder_id: string;
    target_folder_name?: string;
    mode: string;
    authenticated: boolean;
  }> {
    return this.request<{
      provider: string;
      root_folder_id: string;
      target_folder_name?: string;
      mode: string;
      authenticated: boolean;
    }>('/storage/gdrive/status');
  }
}

export const c2cClient = new C2CClient();
