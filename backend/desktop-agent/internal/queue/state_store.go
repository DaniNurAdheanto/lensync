package queue

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/c2c/desktop-agent/internal/adapter"
)

type TaskStatus string

const (
	StatusQueued           TaskStatus = "queued"
	StatusProcessing       TaskStatus = "processing"
	StatusCompleted        TaskStatus = "completed"
	StatusFailed           TaskStatus = "failed"
	StatusRetrying         TaskStatus = "retrying"
	StatusSkippedDuplicate TaskStatus = "duplicate_skipped"
)

type UploadTask struct {
	ID           string                `json:"id"`
	Photo        adapter.DetectedPhoto `json:"photo"`
	SessionID    string                `json:"session_id"`
	Status       TaskStatus            `json:"status"`
	RetryCount   int                   `json:"retry_count"`
	MaxRetries   int                   `json:"max_retries"`
	ErrorMessage string                `json:"error_message,omitempty"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at"`
	CompletedAt  *time.Time            `json:"completed_at,omitempty"`
}

type PersistentStateStore struct {
	filePath string
	mu       sync.RWMutex
	tasks    map[string]*UploadTask
}

func NewPersistentStateStore(path string) (*PersistentStateStore, error) {
	if path == "" {
		path = "./.c2c_queue_state.json"
	}

	store := &PersistentStateStore{
		filePath: path,
		tasks:    make(map[string]*UploadTask),
	}

	if err := store.loadFromDisk(); err != nil {
		log.Printf("[StateStore] Notice: starting fresh state store (reason: %v)", err)
	}

	return store, nil
}

func (s *PersistentStateStore) loadFromDisk() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := os.ReadFile(s.filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	var taskList []*UploadTask
	if err := json.Unmarshal(data, &taskList); err != nil {
		return fmt.Errorf("corrupt state file %s: %w", s.filePath, err)
	}

	for _, t := range taskList {
		s.tasks[t.ID] = t
	}

	log.Printf("[StateStore] Loaded %d persisted upload tasks from %s", len(taskList), s.filePath)
	return nil
}

func (s *PersistentStateStore) flushToDiskLocked() error {
	if err := os.MkdirAll(filepath.Dir(s.filePath), 0755); err != nil {
		return err
	}

	var list []*UploadTask
	for _, t := range s.tasks {
		list = append(list, t)
	}

	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}

	// Atomic write via temp file
	tempFile := s.filePath + ".tmp"
	if err := os.WriteFile(tempFile, data, 0644); err != nil {
		return err
	}

	return os.Rename(tempFile, s.filePath)
}

func (s *PersistentStateStore) SaveTask(task *UploadTask) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.tasks[task.ID] = task
	return s.flushToDiskLocked()
}

func (s *PersistentStateStore) GetTask(id string) (*UploadTask, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	t, exists := s.tasks[id]
	return t, exists
}

func (s *PersistentStateStore) IsCompleted(id string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	t, exists := s.tasks[id]
	if !exists {
		return false
	}
	return t.Status == StatusCompleted || t.Status == StatusSkippedDuplicate
}

func (s *PersistentStateStore) GetPendingTasks() []*UploadTask {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var pending []*UploadTask
	for _, t := range s.tasks {
		if t.Status == StatusQueued || t.Status == StatusProcessing || t.Status == StatusRetrying {
			pending = append(pending, t)
		}
	}
	return pending
}

func (s *PersistentStateStore) GetAllTasks() []*UploadTask {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var all []*UploadTask
	for _, t := range s.tasks {
		all = append(all, t)
	}
	return all
}
