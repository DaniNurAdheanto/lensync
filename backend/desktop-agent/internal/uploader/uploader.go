package uploader

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/c2c/desktop-agent/internal/queue"
)

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

// UploadViaPresignedURL uploads a file directly to the S3 bucket using presigned PUT URL
func (u *S3Uploader) UploadViaPresignedURL(ctx context.Context, task *queue.UploadTask, presignedURL string) error {
	file, err := os.Open(task.Photo.FilePath)
	if err != nil {
		return fmt.Errorf("failed opening file %s: %w", task.Photo.FilePath, err)
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return fmt.Errorf("failed stating file: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, presignedURL, file)
	if err != nil {
		return fmt.Errorf("failed creating PUT request: %w", err)
	}

	req.ContentLength = stat.Size()
	req.Header.Set("Content-Type", determineContentType(task.Photo.Extension))

	resp, err := u.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("network error during S3 upload: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("s3 returned non-2xx status %d: %s", resp.StatusCode, string(bytes.TrimSpace(body)))
	}

	log.Printf("[Uploader] Streamed %d bytes to S3 for %s", stat.Size(), task.Photo.FileName)
	return nil
}

func determineContentType(ext string) string {
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
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
