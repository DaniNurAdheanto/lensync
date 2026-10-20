export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8080/api/v1`;
  }
  return 'http://localhost:8080/api/v1';
}

export function getApiHost(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return 'http://localhost:8080';
}

const BASE_URL = getApiBaseUrl();

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
  rating?: number;
  is_picked?: boolean;
  client_feedback?: string;
  rated_at?: string;
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
  share_token?: string;
  client_name?: string;
  photographer?: string;
  created_at: string;
}

export interface ProofingStats {
  total_count: number;
  picked_count: number;
  rated_count: number;
  average_rating: number;
}

export interface ProofingSessionData {
  session: ShootSession;
  photos: PhotoRecord[];
  stats: ProofingStats;
}

export interface RatingUpdateRequest {
  rating: number;
  is_picked?: boolean;
  client_feedback?: string;
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

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  studio_name?: string;
  role: 'admin' | 'photographer' | 'assistant' | 'client' | 'editor';
  avatar_url?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  expires_in: number;
  user: AuthUser;
  message?: string;
}

export class C2CClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('lensync_token');
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('lensync_token', token);
      } else {
        localStorage.removeItem('lensync_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('lensync_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const effectiveBaseUrl =
      typeof window !== 'undefined' && this.baseURL.includes('localhost:8080')
        ? getApiBaseUrl()
        : this.baseURL;

    const response = await fetch(`${effectiveBaseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API Error [${response.status}]`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        const errorBody = await response.text();
        if (errorBody) errorMessage = errorBody;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  public async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async signUp(payload: {
    full_name: string;
    email: string;
    password: string;
    studio_name?: string;
    role?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  public async getMe(): Promise<{ user: AuthUser }> {
    return this.request<{ user: AuthUser }>('/auth/me');
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

  public async getProofingSession(sessionIdOrToken: string): Promise<ProofingSessionData> {
    return this.request<ProofingSessionData>(`/proofing/${sessionIdOrToken}`);
  }

  public async updatePhotoRating(photoId: string, payload: RatingUpdateRequest): Promise<PhotoRecord> {
    return this.request<PhotoRecord>(`/photos/${photoId}/rating`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getSessionShareLink(sessionId: string): Promise<{ session_id: string; share_url: string; public: boolean }> {
    return this.request<{ session_id: string; share_url: string; public: boolean }>(`/sessions/share?session_id=${sessionId}`);
  }
}

export const c2cClient = new C2CClient();

