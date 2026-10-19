package adapter

import (
	"context"
	"time"
)

type AdapterType string

const (
	AdapterTypeHotfolder AdapterType = "hotfolder_tether"
	AdapterTypePTPMTP    AdapterType = "usb_ptp_mtp"
	AdapterTypeSonySDK   AdapterType = "sony_camera_remote_sdk"
	AdapterTypeCanonSDK  AdapterType = "canon_edsdk"
	AdapterTypeNikonSDK  AdapterType = "nikon_sdk"
)

type AdapterStatus string

const (
	StatusIdle    AdapterStatus = "idle"
	StatusRunning AdapterStatus = "running"
	StatusStopped AdapterStatus = "stopped"
	StatusError   AdapterStatus = "error"
)

type AdapterCapabilities struct {
	CanTriggerCapture bool `json:"can_trigger_capture"`
	CanStreamLiveView bool `json:"can_stream_live_view"`
	CanReadExif       bool `json:"can_read_exif"`
	HotfolderBased    bool `json:"hotfolder_based"`
	SupportsRAW       bool `json:"supports_raw"`
}

type DeviceInfo struct {
	DeviceID       string    `json:"device_id"`
	Vendor         string    `json:"vendor"`
	Model          string    `json:"model"`
	SerialNumber   string    `json:"serial_number,omitempty"`
	ConnectionType string    `json:"connection_type"`
	MountPath      string    `json:"mount_path,omitempty"`
	IsConnected    bool      `json:"is_connected"`
	LastSeen       time.Time `json:"last_seen"`
}

type PhotoEXIF struct {
	CameraMake      string  `json:"camera_make,omitempty"`
	CameraModel     string  `json:"camera_model,omitempty"`
	LensModel       string  `json:"lens_model,omitempty"`
	FocalLengthMm   float64 `json:"focal_length_mm,omitempty"`
	ApertureFStop   float64 `json:"aperture_f_stop,omitempty"`
	ShutterSpeedStr string  `json:"shutter_speed_str,omitempty"`
	ISOSpeed        int     `json:"iso_speed,omitempty"`
}

type DetectedPhoto struct {
	FilePath     string     `json:"file_path"`
	FileName     string     `json:"file_name"`
	Extension    string     `json:"extension"`
	SizeBytes    int64      `json:"size_bytes"`
	SHA256Hash   string     `json:"sha256_hash"`
	EXIF         *PhotoEXIF `json:"exif,omitempty"`
	DiscoveredAt time.Time  `json:"discovered_at"`
}

// CameraAdapter is the pluggable contract for camera ingestion.
// This decouples the agent from specific USB / hardware implementations,
// allowing tether folder watchers, USB PTP/MTP protocols, or vendor SDKs (Sony, Canon, Nikon)
// to be swapped or configured seamlessly.
type CameraAdapter interface {
	ID() string
	Name() string
	Type() AdapterType
	Capabilities() AdapterCapabilities
	Start(ctx context.Context, photoChan chan<- DetectedPhoto) error
	Stop() error
	DetectDevices() ([]DeviceInfo, error)
	Status() AdapterStatus
}
