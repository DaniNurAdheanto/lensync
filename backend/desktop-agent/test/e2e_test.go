package test

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	"github.com/c2c/desktop-agent/internal/adapter"
	"github.com/c2c/desktop-agent/internal/client"
	"github.com/c2c/desktop-agent/internal/queue"
	"github.com/c2c/desktop-agent/internal/uploader"
	"github.com/c2c/desktop-agent/internal/validator"
)

func TestEndToEndCameraToCloudSync(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "c2c-e2e-*")
	if err != nil {
		t.Fatalf("Failed creating temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	hotfolder := filepath.Join(tempDir, "hotfolder")
	queueDB := filepath.Join(tempDir, "queue_state.json")
	if err := os.MkdirAll(hotfolder, 0755); err != nil {
		t.Fatalf("Failed creating hotfolder: %v", err)
	}

	// 1. Setup mock backend API server & mock S3 object storage
	var presignedCallCount int32
	var s3UploadCount int32
	var confirmCallCount int32

	var mockStorageServer *httptest.Server
	mockStorageServer = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPut {
			atomic.AddInt32(&s3UploadCount, 1)
			data, _ := io.ReadAll(r.Body)
			if len(data) == 0 {
				t.Errorf("Received empty upload stream in mock S3")
			}
			w.WriteHeader(http.StatusOK)
			return
		}
		w.WriteHeader(http.StatusMethodNotAllowed)
	}))
	defer mockStorageServer.Close()

	mockAPIServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/v1/uploads/request-presigned-url":
			atomic.AddInt32(&presignedCallCount, 1)
			w.Header().Set("Content-Type", "application/json")
			// Return presigned URL pointing to our mock S3 server
			fmt.Fprintf(w, `{
				"photo_id": "test-photo-uuid-1234",
				"upload_task_id": "test-task-uuid-5678",
				"presigned_url": "%s/c2c-photos/sessions/test-session/DSC_0001.ARW",
				"s3_key": "sessions/test-session/DSC_0001.ARW",
				"already_uploaded": false
			}`, mockStorageServer.URL)

		case "/api/v1/uploads/confirm":
			atomic.AddInt32(&confirmCallCount, 1)
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprintf(w, `{"status":"confirmed","photo_id":"test-photo-uuid-1234"}`)

		default:
			w.WriteHeader(http.StatusOK)
		}
	}))
	defer mockAPIServer.Close()

	// 2. Initialize Agent Components
	stateStore, err := queue.NewPersistentStateStore(queueDB)
	if err != nil {
		t.Fatalf("Failed creating persistent store: %v", err)
	}

	apiClient := client.NewAPIClient(mockAPIServer.URL+"/api/v1", "test-api-key")
	s3Uploader := uploader.NewS3Uploader(8)

	uploadHandler := func(ctx context.Context, task *queue.UploadTask) error {
		presignedRes, err := apiClient.RequestPresignedURL(ctx, client.PresignedURLRequest{
			SessionID:        task.SessionID,
			DeviceID:         "test-agent-device",
			OriginalFilename: task.Photo.FileName,
			FileSizeBytes:    task.Photo.SizeBytes,
			SHA256Hash:       task.Photo.SHA256Hash,
			FileFormat:       task.Photo.Extension,
		})
		if err != nil {
			return err
		}

		if presignedRes.AlreadyUploaded {
			return nil
		}

		uploadRes, err := s3Uploader.UploadViaPresignedURL(ctx, task, presignedRes.PresignedURL)
		if err != nil {
			return err
		}

		confirmReq := client.ConfirmUploadRequest{
			PhotoID:         presignedRes.PhotoID,
			UploadTaskID:    presignedRes.UploadTaskID,
			Success:         true,
			StorageProvider: presignedRes.StorageProvider,
			CameraMake:      "Sony",
			CameraModel:     "ILCE-7M4",
		}
		if uploadRes != nil {
			confirmReq.GDriveFileID = uploadRes.GDriveFileID
			confirmReq.GDriveViewLink = uploadRes.GDriveViewLink
		}

		return apiClient.ConfirmUpload(ctx, confirmReq)
	}

	uploadQueue := queue.NewUploadQueue(2, 3, 1, stateStore, uploadHandler)
	uploadQueue.Start()
	defer uploadQueue.Stop()

	// 3. Test File Write Completion Validator
	val := validator.NewFileValidator(100, 50)
	testFile := filepath.Join(hotfolder, "DSC_0001.ARW")

	// Simulate incremental write by camera tether buffer
	file, err := os.Create(testFile)
	if err != nil {
		t.Fatalf("Failed creating test file: %v", err)
	}
	// Write initial chunk
	file.WriteString("CHUNK_1_RAW_HEADER_DATA_")
	file.Sync()

	// Finish writing
	time.Sleep(60 * time.Millisecond)
	file.WriteString("CHUNK_2_IMAGE_SENSOR_PAYLOAD_COMPLETE")
	file.Close()

	validatedSize, err := val.ValidateFileReady(testFile)
	if err != nil {
		t.Fatalf("File validation failed for completed file: %v", err)
	}
	if validatedSize <= 0 {
		t.Fatalf("Expected validated size > 0, got %d", validatedSize)
	}

	// 4. Test Adapter Ingestion & SHA256 Calculation
	photoChan := make(chan adapter.DetectedPhoto, 10)
	hotfolderAdapter := adapter.NewHotfolderAdapter(hotfolder, []string{".arw", ".jpg"}, 100, 50)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := hotfolderAdapter.Start(ctx, photoChan); err != nil {
		t.Fatalf("Failed starting adapter: %v", err)
	}
	defer hotfolderAdapter.Stop()

	// Receive detected photo
	select {
	case photo := <-photoChan:
		if photo.FileName != "DSC_0001.ARW" {
			t.Errorf("Expected filename DSC_0001.ARW, got %s", photo.FileName)
		}
		if photo.SizeBytes != validatedSize {
			t.Errorf("Expected size %d, got %d", validatedSize, photo.SizeBytes)
		}

		// Enqueue into persistent upload queue
		task, enqueued := uploadQueue.Enqueue(photo, "session-e2e-test")
		if !enqueued || task == nil {
			t.Fatalf("Expected task to be enqueued successfully")
		}

	case <-time.After(3 * time.Second):
		t.Fatalf("Timeout waiting for photo detection from adapter")
	}

	// Wait for worker to finish upload
	time.Sleep(1 * time.Second)

	// 5. Assertions on Upload Flow
	if atomic.LoadInt32(&presignedCallCount) != 1 {
		t.Errorf("Expected 1 call to presigned URL request, got %d", atomic.LoadInt32(&presignedCallCount))
	}
	if atomic.LoadInt32(&s3UploadCount) != 1 {
		t.Errorf("Expected 1 S3 PUT upload, got %d", atomic.LoadInt32(&s3UploadCount))
	}
	if atomic.LoadInt32(&confirmCallCount) != 1 {
		t.Errorf("Expected 1 confirm call, got %d", atomic.LoadInt32(&confirmCallCount))
	}

	// 6. Test Deduplication: Enqueue the same photo again
	photoContent, _ := os.ReadFile(testFile)
	hasher := sha256.New()
	hasher.Write(photoContent)
	expectedHash := hex.EncodeToString(hasher.Sum(nil))

	duplicatePhoto := adapter.DetectedPhoto{
		FilePath:     testFile,
		FileName:     "DSC_0001.ARW",
		Extension:    ".arw",
		SizeBytes:    int64(len(photoContent)),
		SHA256Hash:   expectedHash,
		DiscoveredAt: time.Now(),
	}

	_, enqueuedAgain := uploadQueue.Enqueue(duplicatePhoto, "session-e2e-test")
	if enqueuedAgain {
		t.Errorf("Expected duplicate photo to be skipped by deduplication, but was enqueued")
	}

	// 7. CRITICAL REQUIREMENT: Assert local photo was NEVER deleted!
	if _, err := os.Stat(testFile); os.IsNotExist(err) {
		t.Fatalf("VIOLATION: Local file was deleted after upload! Local files must be preserved.")
	} else if err != nil {
		t.Fatalf("Error accessing local file: %v", err)
	}

	// 8. Assert queue state persistence to disk
	if _, err := os.Stat(queueDB); os.IsNotExist(err) {
		t.Fatalf("Queue state file was not created at %s", queueDB)
	}

	savedTask, exists := stateStore.GetTask(expectedHash)
	if !exists {
		t.Fatalf("Task %s was not found in persistent state store", expectedHash)
	}
	if savedTask.Status != queue.StatusCompleted {
		t.Errorf("Expected task status 'completed', got '%s'", savedTask.Status)
	}

	t.Logf("✓ End-to-end sync, file validation, S3 upload, deduplication, and file preservation PASSED!")
}
