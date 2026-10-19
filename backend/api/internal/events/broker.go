package events

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

type EventType string

const (
	EventPhotoQueued       EventType = "photo:queued"
	EventPhotoPreviewReady EventType = "photo:preview_ready"
	EventPhotoUploading    EventType = "photo:uploading"
	EventPhotoCompleted    EventType = "photo:completed"
	EventPhotoFailed       EventType = "photo:failed"
	EventAgentStatus       EventType = "agent:status"
	EventSessionUpdated    EventType = "session:updated"
	EventPhotoRatingUpdated EventType = "photo:rating_updated"
)

type EventPayload struct {
	Type      EventType   `json:"type"`
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data"`
}

type EventBroker struct {
	mu      sync.RWMutex
	clients map[chan EventPayload]bool
}

var globalBroker *EventBroker
var once sync.Once

func GetBroker() *EventBroker {
	once.Do(func() {
		globalBroker = &EventBroker{
			clients: make(map[chan EventPayload]bool),
		}
	})
	return globalBroker
}

func (b *EventBroker) Subscribe() chan EventPayload {
	b.mu.Lock()
	defer b.mu.Unlock()

	ch := make(chan EventPayload, 50)
	b.clients[ch] = true
	log.Printf("[Events] Client subscribed to SSE stream (total: %d)", len(b.clients))
	return ch
}

func (b *EventBroker) Unsubscribe(ch chan EventPayload) {
	b.mu.Lock()
	defer b.mu.Unlock()

	delete(b.clients, ch)
	close(ch)
	log.Printf("[Events] Client disconnected from SSE stream (total: %d)", len(b.clients))
}

func (b *EventBroker) Broadcast(eventType EventType, data interface{}) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	payload := EventPayload{
		Type:      eventType,
		Timestamp: time.Now(),
		Data:      data,
	}

	for ch := range b.clients {
		select {
		case ch <- payload:
		default:
			log.Printf("[Events] Dropping event for slow consumer")
		}
	}
}

// SSEHandler serves the SSE stream for browsers and dashboards
func (b *EventBroker) SSEHandler(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	eventChan := b.Subscribe()
	defer b.Unsubscribe(eventChan)

	// Send initial connection event
	initData, _ := json.Marshal(map[string]string{
		"message": "Connected to Camera-to-Cloud real-time stream",
	})
	fmt.Fprintf(w, "event: connected\ndata: %s\n\n", initData)
	flusher.Flush()

	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			// Keep-alive heartbeat comment
			fmt.Fprintf(w, ": heartbeat\n\n")
			flusher.Flush()
		case evt, ok := <-eventChan:
			if !ok {
				return
			}
			jsonData, err := json.Marshal(evt.Data)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "event: %s\ndata: %s\n\n", evt.Type, jsonData)
			flusher.Flush()
		}
	}
}
