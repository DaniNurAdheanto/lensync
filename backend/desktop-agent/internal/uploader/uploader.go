package uploader

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/c2c/desktop-agent/internal/queue"
)

type UploadResult struct {
	BytesUploaded  int64  `json:"bytes_uploaded"`
	GDriveFileID   string `json:"gdrive_file_id,omitempty"`
	GDriveViewLink string `json:"gdrive_view_link,omitempty"`
}

type S3Uploader struct {
	httpClient *http.Client
	chunkSize  int64
}

func NewS3Uploader(chunkSizeMB int) *S3Uploader {
	return &S3Uploader{
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
		chunkSize: int64(chunkSizeMB) * 1024 * 1024,
	}
}

// UploadViaPresignedURL uploads a file directly to Google Drive or S3 using presigned/resumable PUT URL
func (u *S3Uploader) UploadViaPresignedURL(ctx context.Context, task *queue.UploadTask, presignedURL string) (*UploadResult, error) {
	file, err := os.Open(task.Photo.FilePath)
	if err != nil {
		return nil, fmt.Errorf("failed opening file %s: %w", task.Photo.FilePath, err)
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return nil, fmt.Errorf("failed stating file: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, presignedURL, file)
	if err != nil {
		return nil, fmt.Errorf("failed creating PUT request: %w", err)
	}

	req.ContentLength = stat.Size()
	req.Header.Set("Content-Type", determineContentType(task.Photo.Extension))

	resp, err := u.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("network error during cloud upload: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("cloud storage returned non-2xx status %d: %s", resp.StatusCode, string(bytes.TrimSpace(respBody)))
	}

	result := &UploadResult{
		BytesUploaded: stat.Size(),
	}

	// Try parsing Google Drive file metadata response if present
	var gdriveRes struct {
		ID          string `json:"id"`
		WebViewLink string `json:"webViewLink"`
	}
	if err := json.Unmarshal(respBody, &gdriveRes); err == nil && gdriveRes.ID != "" {
		result.GDriveFileID = gdriveRes.ID
		result.GDriveViewLink = gdriveRes.WebViewLink
		log.Printf("[Uploader] Streamed %d bytes directly to Google Drive (ID: %s, Link: %s)", stat.Size(), gdriveRes.ID, gdriveRes.WebViewLink)
	} else {
		log.Printf("[Uploader] Streamed %d bytes to Cloud Storage for %s", stat.Size(), task.Photo.FileName)
	}

	return result, nil
}

func determineContentType(ext string) string {
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".cr3", ".cr2":
		return "image/x-canon-cr3"
	case ".arw":
		return "image/x-sony-arw"
	case ".nef":
		return "image/x-nikon-nef"
	case ".dng":
		return "image/x-adobe-dng"
	case ".heic":
		return "image/heic"
	default:
		return "application/octet-stream"
	}
}
