package queue

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/c2c/desktop-agent/internal/watcher"
)

type TaskStatus string

const (
	StatusQueued     TaskStatus = "queued"
	StatusProcessing TaskStatus = "processing"
	StatusCompleted  TaskStatus = "completed"
	StatusFailed     TaskStatus = "failed"
	StatusRetrying   TaskStatus = "retrying"
)

type UploadTask struct {
	ID           string
	Photo        watcher.DetectedPhoto
	Status       TaskStatus
	RetryCount   int
	MaxRetries   int
	ErrorMessage string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type UploadHandlerFunc func(ctx context.Context, task *UploadTask) error

type UploadQueue struct {
	concurrency int
	maxRetries  int
	retryDelay  time.Duration
	tasksChan   chan *UploadTask
	handler     UploadHandlerFunc
	tasksMu     sync.RWMutex
	allTasks    map[string]*UploadTask
	wg          sync.WaitGroup
	ctx         context.Context
	cancel      context.CancelFunc
}

func NewUploadQueue(concurrency int, maxRetries int, retryDelaySec int, handler UploadHandlerFunc) *UploadQueue {
	ctx, cancel := context.WithCancel(context.Background())
	return &UploadQueue{
		concurrency: concurrency,
		maxRetries:  maxRetries,
		retryDelay:  time.Duration(retryDelaySec) * time.Second,
		tasksChan:   make(chan *UploadTask, 500),
		handler:     handler,
		allTasks:    make(map[string]*UploadTask),
		ctx:         ctx,
		cancel:      cancel,
	}
}

func (q *UploadQueue) Start() {
	log.Printf("[Queue] Starting upload queue manager with %d concurrent workers", q.concurrency)
	for i := 1; i <= q.concurrency; i++ {
		q.wg.Add(1)
		go q.worker(i)
	}
}

func (q *UploadQueue) Enqueue(photo watcher.DetectedPhoto) *UploadTask {
	task := &UploadTask{
		ID:         photo.SHA256Hash,
		Photo:      photo,
		Status:     StatusQueued,
		RetryCount: 0,
		MaxRetries: q.maxRetries,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	q.tasksMu.Lock()
	q.allTasks[task.ID] = task
	q.tasksMu.Unlock()

	log.Printf("[Queue] Enqueued task for %s (%s)", photo.FileName, task.ID[:8])
	q.tasksChan <- task
	return task
}

func (q *UploadQueue) worker(workerID int) {
	defer q.wg.Done()
	log.Printf("[Queue Worker #%d] Ready to process upload tasks", workerID)

	for {
		select {
		case <-q.ctx.Done():
			log.Printf("[Queue Worker #%d] Shutting down", workerID)
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
	log.Printf("[Worker #%d] Uploading %s (attempt %d/%d)", workerID, task.Photo.FileName, task.RetryCount+1, task.MaxRetries)

	err := q.handler(q.ctx, task)
	if err == nil {
		task.Status = StatusCompleted
		task.UpdatedAt = time.Now()
		log.Printf("[Worker #%d] Successfully uploaded %s to cloud", workerID, task.Photo.FileName)
		return
	}

	// Retry handling
	task.RetryCount++
	task.ErrorMessage = err.Error()
	task.UpdatedAt = time.Now()

	if task.RetryCount <= task.MaxRetries {
		task.Status = StatusRetrying
		log.Printf("[Worker #%d] Upload failed for %s: %v. Scheduling retry #%d in %v", workerID, task.Photo.FileName, err, task.RetryCount, q.retryDelay)
		go func(t *UploadTask) {
			select {
			case <-q.ctx.Done():
				return
			case <-time.After(q.retryDelay):
				q.tasksChan <- t
			}
		}(task)
	} else {
		task.Status = StatusFailed
		log.Printf("[Worker #%d] Permanently failed uploading %s after %d retries: %v", workerID, task.Photo.FileName, task.MaxRetries, err)
	}
}

func (q *UploadQueue) Stop() {
	q.cancel()
	close(q.tasksChan)
	q.wg.Wait()
	log.Println("[Queue] Upload queue manager stopped cleanly.")
}
