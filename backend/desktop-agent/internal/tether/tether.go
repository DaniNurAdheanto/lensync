package tether

import (
	"log"
	"os"
	"runtime"
	"strings"
	"time"
)

type CameraDevice struct {
	DeviceID     string
	Vendor       string
	Model        string
	ConnectionType string // "USB_PTP", "USB_MTP", "HOTFOLDER"
	MountPath    string
	IsConnected  bool
	LastDetected time.Time
}

type TetherDetector struct {
	knownVendors []string
	stopChan     chan struct{}
}

func NewTetherDetector() *TetherDetector {
	return &TetherDetector{
		knownVendors: []string{"Canon", "Sony", "Nikon", "Fujifilm", "Panasonic", "Leica", "Hasselblad", "Android", "Apple"},
		stopChan:     make(chan struct{}),
	}
}

// ScanConnectedDevices inspects standard OS mount paths or USB tethering mount points
func (t *TetherDetector) ScanConnectedDevices() []CameraDevice {
	var devices []CameraDevice

	// Scan typical macOS and Linux camera mount points
	potentialPaths := []string{
		"/Volumes",         // macOS mounted cameras / SD cards
		"/media",           // Linux automount
		"/run/user/1000/gvfs", // Linux MTP camera mount
	}

	for _, basePath := range potentialPaths {
		entries, err := os.ReadDir(basePath)
		if err != nil {
			continue
		}

		for _, entry := range entries {
			name := entry.Name()
			for _, vendor := range t.knownVendors {
				if strings.Contains(strings.ToLower(name), strings.ToLower(vendor)) {
					devices = append(devices, CameraDevice{
						DeviceID:       name,
						Vendor:         vendor,
						Model:          name,
						ConnectionType: "USB_TETHER",
						MountPath:      basePath + "/" + name,
						IsConnected:    true,
						LastDetected:   time.Now(),
					})
				}
			}
		}
	}

	log.Printf("[Tether] Discovered %d connected camera devices (OS: %s)", len(devices), runtime.GOOS)
	return devices
}
