package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "healthy",
		"service":   "c2c-api",
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "0.1.0",
	})
}
