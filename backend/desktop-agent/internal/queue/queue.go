package queue

import (
	"context"
	"log"
	"math/rand"
	"sync"
	"time"

	"github.com/c2c/desktop-agent/internal/adapter"
)

type UploadHandlerFunc func(ctx context.Context, task *UploadTask) error

type UploadQueue struct {
	concurrency int
	maxRetries  int
	baseDelay   time.Duration
	tasksChan   chan *UploadTask
	handler     UploadHandlerFunc
	stateStore  *PersistentStateStore
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
	isRunning   bool
	mu          sync.RWMutex
}

func NewUploadQueue(
	concurrency int,
	maxRetries int,
	retryDelaySec int,
	store *PersistentStateStore,
	handler UploadHandlerFunc,
) *UploadQueue {
	if concurrency <= 0 {
		concurrency = 2
	}
	if maxRetries <= 0 {
		maxRetries = 5
	}
	if retryDelaySec <= 0 {
		retryDelaySec = 2
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &UploadQueue{
		concurrency: concurrency,
		maxRetries:  maxRetries,
		baseDelay:   time.Duration(retryDelaySec) * time.Second,
		tasksChan:   make(chan *UploadTask, 1000),
		handler:     handler,
		stateStore:  store,
		ctx:         ctx,
		cancel:      cancel,
		isRunning:   false,
	}
}

// Start launches worker pool and recovers any pending tasks from the persistent store
func (q *UploadQueue) Start() {
	q.mu.Lock()
	if q.isRunning {
		q.mu.Unlock()
		return
	}
	q.isRunning = true
	q.mu.Unlock()

	log.Printf("[Queue] Starting persistent upload queue with %d workers (max retries: %d)", q.concurrency, q.maxRetries)

	for i := 1; i <= q.concurrency; i++ {
		q.wg.Add(1)
		go q.worker(i)
	}

	// Recover any unfinished tasks from previous agent runs
	pending := q.stateStore.GetPendingTasks()
	if len(pending) > 0 {
		log.Printf("[Queue] Recovering %d pending tasks from previous session", len(pending))
		for _, task := range pending {
			task.Status = StatusQueued
			_ = q.stateStore.SaveTask(task)
			q.tasksChan <- task
		}
	}
}

// Enqueue adds a detected photo to the persistent upload queue after deduplication checks
func (q *UploadQueue) Enqueue(photo adapter.DetectedPhoto, sessionID string) (*UploadTask, bool) {
	// 1. Fast local deduplication check: if photo hash is already marked completed, skip it
	if q.stateStore.IsCompleted(photo.SHA256Hash) {
		log.Printf("[Queue] Deduplication: Photo %s (%s) already completed. Skipping enqueue.", photo.FileName, photo.SHA256Hash[:8])
		return nil, false
	}

	task := &UploadTask{
		ID:         photo.SHA256Hash,
		Photo:      photo,
		SessionID:  sessionID,
		Status:     StatusQueued,
		RetryCount: 0,
		MaxRetries: q.maxRetries,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	// Persist task to disk
	if err := q.stateStore.SaveTask(task); err != nil {
		log.Printf("[Queue] Warning: failed saving task to persistent store: %v", err)
	}

	log.Printf("[Queue] Enqueued task: %s (%s, %d bytes)", photo.FileName, task.ID[:8], photo.SizeBytes)

	select {
	case q.tasksChan <- task:
		return task, true
	case <-q.ctx.Done():
		return nil, false
	}
}

func (q *UploadQueue) worker(workerID int) {
	defer q.wg.Done()
	log.Printf("[Queue Worker #%d] Online and ready", workerID)

	for {
		select {
		case <-q.ctx.Done():
			log.Printf("[Queue Worker #%d] Stopped", workerID)
			return
		case task, ok := <-q.tasksChan:
			if !ok {
				return
			}
			q.processTask(workerID, task)
		}
	}
}

func (q *UploadQueue) processTask(workerID int, task *UploadTask) {
	task.Status = StatusProcessing
	task.UpdatedAt = time.Now()
	_ = q.stateStore.SaveTask(task)

	log.Printf("[Worker #%d] Processing upload for %s (attempt %d/%d)", workerID, task.Photo.FileName, task.RetryCount+1, task.MaxRetries)

	err := q.handler(q.ctx, task)
	now := time.Now()

	if err == nil {
		task.Status = StatusCompleted
		task.UpdatedAt = now
		task.CompletedAt = &now
		task.ErrorMessage = ""
		_ = q.stateStore.SaveTask(task)
		log.Printf("[Worker #%d] Successfully uploaded %s to cloud (local file kept intact)", workerID, task.Photo.FileName)
		return
	}

	// Error occurred - evaluate retry with exponential backoff
	task.RetryCount++
	task.ErrorMessage = err.Error()
	task.UpdatedAt = now

	if task.RetryCount <= task.MaxRetries {
		task.Status = StatusRetrying
		_ = q.stateStore.SaveTask(task)

		// Exponential backoff: baseDelay * 2^(retryCount-1) + small jitter
		backoffFactor := 1 << (task.RetryCount - 1)
		backoffDuration := q.baseDelay * time.Duration(backoffFactor)
		if backoffDuration > 60*time.Second {
			backoffDuration = 60 * time.Second
		}
		// Add up to 500ms jitter
		jitter := time.Duration(rand.Intn(500)) * time.Millisecond
		totalDelay := backoffDuration + jitter

		log.Printf("[Worker #%d] Upload failed for %s: %v. Scheduling exponential backoff retry #%d in %v",
			workerID, task.Photo.FileName, err, task.RetryCount, totalDelay)

		go func(t *UploadTask, delay time.Duration) {
			select {
			case <-q.ctx.Done():
				return
			case <-time.After(delay):
				select {
				case q.tasksChan <- t:
				case <-q.ctx.Done():
				}
			}
		}(task, totalDelay)
	} else {
		task.Status = StatusFailed
		_ = q.stateStore.SaveTask(task)
		log.Printf("[Worker #%d] Permanently failed uploading %s after %d retries: %v", workerID, task.Photo.FileName, task.MaxRetries, err)
	}
}

func (q *UploadQueue) MarkSkippedDuplicate(task *UploadTask) {
	now := time.Now()
	task.Status = StatusSkippedDuplicate
	task.UpdatedAt = now
	task.CompletedAt = &now
	_ = q.stateStore.SaveTask(task)
	log.Printf("[Queue] Marked %s as duplicate_skipped in state store", task.Photo.FileName)
}

func (q *UploadQueue) GetAllTasks() []*UploadTask {
	return q.stateStore.GetAllTasks()
}

func (q *UploadQueue) Stop() {
	q.mu.Lock()
	if !q.isRunning {
		q.mu.Unlock()
		return
	}
	q.isRunning = false
	q.mu.Unlock()

	q.cancel()
	close(q.tasksChan)
	q.wg.Wait()
	log.Println("[Queue] Upload queue workers stopped cleanly.")
}
