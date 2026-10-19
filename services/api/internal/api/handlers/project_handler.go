package handlers

import (
	"encoding/json"
	"net/http"
)

type ProjectHandler struct{}

func NewProjectHandler() *ProjectHandler {
	return &ProjectHandler{}
}

func (h *ProjectHandler) ListProjects(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode([]map[string]interface{}{
		{
			"id":                    "proj_fashion_week_2026",
			"name":                  "Paris Fashion Week Runway Shoot",
			"client_name":           "Vogue Studio",
			"storage_folder_prefix": "pfw_2026",
			"is_active":             true,
		},
	})
}
