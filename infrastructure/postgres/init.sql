-- Camera-to-Cloud (C2C) Database Initializer
-- Enables required extensions and creates foundational tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types for status tracking
CREATE TYPE user_role AS ENUM ('admin', 'photographer', 'assistant', 'client', 'editor');
CREATE TYPE device_type AS ENUM ('dslr_camera', 'mirrorless_camera', 'smartphone_android', 'smartphone_ios', 'desktop_agent');
CREATE TYPE device_status AS ENUM ('offline', 'online', 'tethered', 'syncing', 'error');
CREATE TYPE upload_status AS ENUM ('queued', 'uploading', 'completed', 'failed', 'paused');
CREATE TYPE photo_format AS ENUM ('RAW_CR3', 'RAW_CR2', 'RAW_ARW', 'RAW_NEF', 'RAW_DNG', 'JPEG', 'HEIC', 'TIFF');

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role DEFAULT 'photographer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_folder_prefix VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Shoot Sessions Table
CREATE TABLE IF NOT EXISTS shoot_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    location VARCHAR(255),
    is_live BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tethered Devices Table (Cameras & Agents)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_uid VARCHAR(120) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    device_type device_type NOT NULL,
    model_name VARCHAR(150),
    serial_number VARCHAR(120),
    status device_status DEFAULT 'offline',
    agent_version VARCHAR(50),
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    current_session_id UUID REFERENCES shoot_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Photos Table (Originals & Previews)
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES shoot_sessions(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_format photo_format NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    s3_bucket VARCHAR(120) NOT NULL,
    s3_key_original VARCHAR(500) NOT NULL,
    s3_key_preview VARCHAR(500),
    s3_key_thumbnail VARCHAR(500),
    
    -- EXIF & Camera Telemetry
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    lens_model VARCHAR(150),
    focal_length_mm NUMERIC(6, 2),
    aperture_f_stop NUMERIC(4, 1),
    shutter_speed_str VARCHAR(50),
    iso_speed INTEGER,
    captured_at TIMESTAMP WITH TIME ZONE,
    
    -- Sync Status
    upload_status upload_status DEFAULT 'queued',
    uploaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_photo_per_session_hash UNIQUE (session_id, sha256_hash)
);

-- 6. Upload Tasks (Queue & Retry Management)
CREATE TABLE IF NOT EXISTS upload_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    agent_id VARCHAR(120) NOT NULL,
    status upload_status DEFAULT 'queued',
    bytes_uploaded BIGINT DEFAULT 0,
    total_bytes BIGINT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    last_error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-throughput photo ingestion
CREATE INDEX IF NOT EXISTS idx_photos_session_id ON photos(session_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(upload_status);
CREATE INDEX IF NOT EXISTS idx_upload_tasks_status ON upload_tasks(status);
CREATE INDEX IF NOT EXISTS idx_devices_uid ON devices(device_uid);
