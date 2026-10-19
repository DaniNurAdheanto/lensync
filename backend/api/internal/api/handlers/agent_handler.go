package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"time"
)

type AgentHandler struct {
	agentURL   string
	httpClient *http.Client
}

func NewAgentHandler() *AgentHandler {
	agentURL := os.Getenv("AGENT_URL")
	if agentURL == "" {
		agentURL = "http://localhost:8081"
	}

	return &AgentHandler{
		agentURL: agentURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// GetStatus proxies status request to the local sync agent daemon
func (h *AgentHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	resp, err := h.httpClient.Get(h.agentURL + "/status")
	if err != nil {
		// If agent is not currently running, return offline fallback status
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":            "offline",
			"is_running":        false,
			"agent_id":          "agent-local-daemon",
			"watch_path":        "",
			"active_session_id": "",
			"message":           "Desktop Agent daemon is offline or stopped. Start it via agent command.",
		})
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// StartSync tells the local sync agent to start file watching and upload queue
func (h *AgentHandler) StartSync(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	body, _ := io.ReadAll(r.Body)
	resp, err := h.httpClient.Post(h.agentURL+"/start", "application/json", bytes.NewReader(body))
	if err != nil {
		http.Error(w, "Failed connecting to local agent daemon: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// StopSync tells the local sync agent to stop file watching
func (h *AgentHandler) StopSync(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	resp, err := h.httpClient.Post(h.agentURL+"/stop", "application/json", nil)
	if err != nil {
		http.Error(w, "Failed connecting to local agent daemon: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// UpdateConfig updates agent hotfolder watch path and active session
func (h *AgentHandler) UpdateConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	body, _ := io.ReadAll(r.Body)
	resp, err := h.httpClient.Post(h.agentURL+"/config", "application/json", bytes.NewReader(body))
	if err != nil {
		http.Error(w, "Failed connecting to local agent daemon: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// GetQueue fetches real-time queue tasks from local sync agent
func (h *AgentHandler) GetQueue(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	resp, err := h.httpClient.Get(h.agentURL + "/queue")
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"tasks": []interface{}{},
			"total": 0,
		})
		return
	}
	defer resp.Body.Close()

	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
