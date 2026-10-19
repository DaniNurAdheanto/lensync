package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

type DeviceHandler struct{}

func NewDeviceHandler() *DeviceHandler {
	return &DeviceHandler{}
}

type DeviceRegistration struct {
	DeviceUID    string `json:"device_uid"`
	Name         string `json:"name"`
	DeviceType   string `json:"device_type"`
	ModelName    string `json:"model_name"`
	SerialNumber string `json:"serial_number"`
	AgentVersion string `json:"agent_version"`
}

func (h *DeviceHandler) RegisterDevice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req DeviceRegistration
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid device payload", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":             "dev_" + req.DeviceUID,
		"device_uid":     req.DeviceUID,
		"name":           req.Name,
		"status":         "online",
		"last_heartbeat": time.Now().Format(time.RFC3339),
	})
}
