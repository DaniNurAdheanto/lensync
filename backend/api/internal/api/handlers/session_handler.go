package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/c2c/api/internal/services"
)

type SessionHandler struct {
	sessionService *services.SessionService
}

func NewSessionHandler(s *services.SessionService) *SessionHandler {
	return &SessionHandler{sessionService: s}
}

type CreateSessionInput struct {
	ProjectID string `json:"project_id"`
	Title     string `json:"title"`
	Location  string `json:"location"`
}

func (h *SessionHandler) HandleSessions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		projectID := r.URL.Query().Get("project_id")
		sessions, err := h.sessionService.ListSessions(r.Context(), projectID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(sessions)

	case http.MethodPost:
		var input CreateSessionInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		session, err := h.sessionService.CreateSession(r.Context(), input.ProjectID, input.Title, input.Location)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(session)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
