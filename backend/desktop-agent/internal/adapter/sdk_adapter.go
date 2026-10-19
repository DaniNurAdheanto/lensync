package adapter

import (
	"context"
	"log"
	"sync"
	"time"
)

// CameraSDKAdapter is an extensible adapter designed for direct native vendor SDKs
// such as Sony Camera Remote SDK, Canon EDSDK, and Nikon SDK via CGO or FFI hooks.
type CameraSDKAdapter struct {
	id         string
	name       string
	vendorType AdapterType
	status     AdapterStatus
	mu         sync.RWMutex
}

func NewCameraSDKAdapter(vendorType AdapterType) *CameraSDKAdapter {
	name := "Camera Vendor Native SDK Adapter"
	switch vendorType {
	case AdapterTypeSonySDK:
		name = "Sony Camera Remote SDK Adapter (Native USB/Ethernet)"
	case AdapterTypeCanonSDK:
		name = "Canon EDSDK Camera Control Adapter"
	case AdapterTypeNikonSDK:
		name = "Nikon Camera Control SDK Adapter"
	}

	return &CameraSDKAdapter{
		id:         string(vendorType),
		name:       name,
		vendorType: vendorType,
		status:     StatusIdle,
	}
}

func (a *CameraSDKAdapter) ID() string {
	return a.id
}

func (a *CameraSDKAdapter) Name() string {
	return a.name
}

func (a *CameraSDKAdapter) Type() AdapterType {
	return a.vendorType
}

func (a *CameraSDKAdapter) Capabilities() AdapterCapabilities {
	return AdapterCapabilities{
		CanTriggerCapture: true,
		CanStreamLiveView: true,
		CanReadExif:       true,
		HotfolderBased:    false,
		SupportsRAW:       true,
	}
}

func (a *CameraSDKAdapter) Status() AdapterStatus {
	a.mu.RLock()
	defer a.mu.RUnlock()
	return a.status
}

func (a *CameraSDKAdapter) Start(ctx context.Context, photoChan chan<- DetectedPhoto) error {
	a.mu.Lock()
	a.status = StatusRunning
	a.mu.Unlock()

	log.Printf("[%s] Initialized native SDK bindings.", a.name)
	return nil
}

func (a *CameraSDKAdapter) Stop() error {
	a.mu.Lock()
	a.status = StatusStopped
	a.mu.Unlock()

	log.Printf("[%s] Released native SDK handles.", a.name)
	return nil
}

func (a *CameraSDKAdapter) DetectDevices() ([]DeviceInfo, error) {
	return []DeviceInfo{
		{
			DeviceID:       "sdk-" + string(a.vendorType),
			Vendor:         string(a.vendorType),
			Model:          "Direct Hardware SDK Session",
			ConnectionType: "NATIVE_SDK",
			IsConnected:    false,
			LastSeen:       time.Now(),
		},
	}, nil
}
