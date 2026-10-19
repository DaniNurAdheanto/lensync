package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/c2c/desktop-agent/internal/adapter"
	"github.com/c2c/desktop-agent/internal/queue"
)

type ControlServer struct {
	addr            string
	agentID         string
	agentName       string
	activeSessionID string
	activeProjectID string
	registry        *adapter.AdapterRegistry
	queue           *queue.UploadQueue
	photoChan       chan adapter.DetectedPhoto
	isSyncing       bool
	syncCancel      context.CancelFunc
	mu              sync.RWMutex
	httpServer      *http.Server
}

type StartRequest struct {
	WatchPath string `json:"watch_path,omitempty"`
	SessionID string `json:"session_id,omitempty"`
	ProjectID string `json:"project_id,omitempty"`
	AdapterID string `json:"adapter_id,omitempty"`
}

type ConfigRequest struct {
	WatchPath string `json:"watch_path,omitempty"`
	SessionID string `json:"session_id,omitempty"`
	ProjectID string `json:"project_id,omitempty"`
	AdapterID string `json:"adapter_id,omitempty"`
}

func NewControlServer(
	addr string,
	agentID string,
	agentName string,
	initialSession string,
	initialProject string,
	registry *adapter.AdapterRegistry,
	uploadQueue *queue.UploadQueue,
	photoChan chan adapter.DetectedPhoto,
) *ControlServer {
	return &ControlServer{
		addr:            addr,
		agentID:         agentID,
		agentName:       agentName,
		activeSessionID: initialSession,
		activeProjectID: initialProject,
		registry:        registry,
		queue:           uploadQueue,
		photoChan:       photoChan,
		isSyncing:       false,
	}
}

func (s *ControlServer) Start() error {
	mux := http.NewServeMux()

	mux.HandleFunc("/status", s.handleStatus)
	mux.HandleFunc("/start", s.handleStart)
	mux.HandleFunc("/stop", s.handleStop)
	mux.HandleFunc("/config", s.handleConfig)
	mux.HandleFunc("/queue", s.handleQueue)
	mux.HandleFunc("/scan", s.handleScan)

	// Wrap with CORS
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		mux.ServeHTTP(w, r)
	})

	s.httpServer = &http.Server{
		Addr:    s.addr,
		Handler: handler,
	}

	log.Printf("[ControlServer] Desktop Agent control API listening on http://localhost%s", s.addr)
	go func() {
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("[ControlServer] Error: %v", err)
		}
	}()

	return nil
}

func (s *ControlServer) Stop() {
	if s.httpServer != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = s.httpServer.Shutdown(ctx)
	}
}

func (s *ControlServer) handleStatus(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	activeAdapter := s.registry.GetActive()
	watchPath := ""
	adapterName := ""
	adapterID := ""
	if activeAdapter != nil {
		adapterName = activeAdapter.Name()
		adapterID = activeAdapter.ID()
		if hf, ok := activeAdapter.(*adapter.HotfolderAdapter); ok {
			watchPath = hf.GetWatchPath()
		}
	}

	tasks := s.queue.GetAllTasks()
	completedCount := 0
	retryingCount := 0
	uploadingCount := 0
	queuedCount := 0

	for _, t := range tasks {
		switch t.Status {
		case queue.StatusCompleted, queue.StatusSkippedDuplicate:
			completedCount++
		case queue.StatusRetrying:
			retryingCount++
		case queue.StatusProcessing:
			uploadingCount++
		case queue.StatusQueued:
			queuedCount++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":            "online",
		"is_running":        s.isSyncing,
		"agent_id":          s.agentID,
		"agent_name":        s.agentName,
		"active_session_id": s.activeSessionID,
		"active_project_id": s.activeProjectID,
		"watch_path":        watchPath,
		"adapter_id":        adapterID,
		"adapter_name":      adapterName,
		"queue_summary": map[string]int{
			"total":     len(tasks),
			"completed": completedCount,
			"uploading": uploadingCount,
			"retrying":  retryingCount,
			"queued":    queuedCount,
		},
	})
}

func (s *ControlServer) handleStart(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req StartRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	s.mu.Lock()
	if s.isSyncing {
		s.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Sync is already active",
			"status":  "running",
		})
		return
	}

	if req.SessionID != "" {
		s.activeSessionID = req.SessionID
	}
	if req.ProjectID != "" {
		s.activeProjectID = req.ProjectID
	}

	activeAdapter := s.registry.GetActive()
	if req.AdapterID != "" {
		if adp, err := s.registry.SetActive(req.AdapterID); err == nil {
			activeAdapter = adp
		}
	}

	if req.WatchPath != "" {
		if hf, ok := activeAdapter.(*adapter.HotfolderAdapter); ok {
			hf.SetWatchPath(req.WatchPath)
		}
	}

	syncCtx, cancel := context.WithCancel(context.Background())
	s.syncCancel = cancel
	s.isSyncing = true

	// Start active adapter
	if err := activeAdapter.Start(syncCtx, s.photoChan); err != nil {
		s.isSyncing = false
		s.mu.Unlock()
		http.Error(w, "Failed starting adapter: "+err.Error(), http.StatusInternalServerError)
		return
	}
	s.mu.Unlock()

	log.Printf("[ControlServer] Sync STARTED for session %s (adapter: %s)", s.activeSessionID, activeAdapter.Name())

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "running",
		"message":    "Sync started successfully",
		"session_id": s.activeSessionID,
	})
}

func (s *ControlServer) handleStop(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	s.mu.Lock()
	if !s.isSyncing {
		s.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Sync is already stopped",
			"status":  "stopped",
		})
		return
	}

	if s.syncCancel != nil {
		s.syncCancel()
	}
	activeAdapter := s.registry.GetActive()
	if activeAdapter != nil {
		_ = activeAdapter.Stop()
	}
	s.isSyncing = false
	s.mu.Unlock()

	log.Println("[ControlServer] Sync STOPPED cleanly.")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "stopped",
		"message": "Sync stopped successfully",
	})
}

func (s *ControlServer) handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ConfigRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	s.mu.Lock()
	if req.SessionID != "" {
		s.activeSessionID = req.SessionID
	}
	if req.ProjectID != "" {
		s.activeProjectID = req.ProjectID
	}

	activeAdapter := s.registry.GetActive()
	if req.AdapterID != "" {
		if adp, err := s.registry.SetActive(req.AdapterID); err == nil {
			activeAdapter = adp
		}
	}

	if req.WatchPath != "" {
		if hf, ok := activeAdapter.(*adapter.HotfolderAdapter); ok {
			hf.SetWatchPath(req.WatchPath)
		}
	}
	s.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "updated",
		"session_id": s.activeSessionID,
		"project_id": s.activeProjectID,
	})
}

func (s *ControlServer) handleQueue(w http.ResponseWriter, r *http.Request) {
	tasks := s.queue.GetAllTasks()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tasks": tasks,
		"total": len(tasks),
	})
}

func (s *ControlServer) handleScan(w http.ResponseWriter, r *http.Request) {
	activeAdapter := s.registry.GetActive()
	devices, err := activeAdapter.DetectDevices()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"devices": devices,
		"count":   len(devices),
	})
}

func (s *ControlServer) GetActiveSessionID() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.activeSessionID
}

func (s *ControlServer) SetSyncing(syncing bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.isSyncing = syncing
}
