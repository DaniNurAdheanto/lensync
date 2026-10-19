package storage

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type S3Storage struct {
	endpoint       string
	accessKey      string
	secretKey      string
	bucketName     string
	useSSL         bool
	isLocalMock    bool
	localStorageDir string
}

func NewS3Storage(endpoint, accessKey, secretKey, bucketName string, useSSL bool) *S3Storage {
	// Detect if local mock storage is requested or if default endpoint is used
	isMock := os.Getenv("S3_MOCK") == "true" || endpoint == "" || strings.HasPrefix(endpoint, "local")

	storageDir := os.Getenv("LOCAL_STORAGE_DIR")
	if storageDir == "" {
		storageDir = "./.c2c_storage"
	}

	if isMock {
		if err := os.MkdirAll(filepath.Join(storageDir, bucketName), 0755); err != nil {
			log.Printf("[Storage] Warning creating local storage directory: %v", err)
		}
		log.Printf("[Storage] Initialized S3 storage with local mock engine at %s", storageDir)
	}

	return &S3Storage{
		endpoint:        endpoint,
		accessKey:       accessKey,
		secretKey:       secretKey,
		bucketName:      bucketName,
		useSSL:          useSSL,
		isLocalMock:     isMock,
		localStorageDir: storageDir,
	}
}

// GeneratePresignedPutURL creates a standard S3/MinIO compatible presigned PUT URL
func (s *S3Storage) GeneratePresignedPutURL(objectKey string, expiryDuration time.Duration) (string, error) {
	expires := time.Now().Add(expiryDuration).Unix()
	stringToSign := fmt.Sprintf("PUT\n\n\n%d\n/%s/%s", expires, s.bucketName, objectKey)

	mac := hmac.New(sha1.New, []byte(s.secretKey))
	mac.Write([]byte(stringToSign))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	query := url.Values{}
	query.Set("AWSAccessKeyId", s.accessKey)
	query.Set("Signature", signature)
	query.Set("Expires", fmt.Sprintf("%d", expires))

	if s.isLocalMock {
		// Route to local backend mock storage endpoint
		apiPort := os.Getenv("PORT")
		if apiPort == "" {
			apiPort = "8080"
		}
		presignedURL := fmt.Sprintf("http://localhost:%s/api/v1/storage/upload/%s/%s?%s", apiPort, s.bucketName, objectKey, query.Encode())
		return presignedURL, nil
	}

	scheme := "http"
	if s.useSSL {
		scheme = "https"
	}

	presignedURL := fmt.Sprintf("%s://%s/%s/%s?%s", scheme, s.endpoint, s.bucketName, objectKey, query.Encode())
	return presignedURL, nil
}

func (s *S3Storage) GetBucketName() string {
	return s.bucketName
}

func (s *S3Storage) IsLocalMock() bool {
	return s.isLocalMock
}

// HandleMockUpload processes direct S3 PUT stream when running in local mock storage mode
func (s *S3Storage) HandleMockUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Validate path: /api/v1/storage/upload/{bucket}/{objectKey...}
	prefix := "/api/v1/storage/upload/"
	if !strings.HasPrefix(r.URL.Path, prefix) {
		http.Error(w, "Invalid storage path", http.StatusBadRequest)
		return
	}

	subPath := strings.TrimPrefix(r.URL.Path, prefix)
	parts := strings.SplitN(subPath, "/", 2)
	if len(parts) < 2 {
		http.Error(w, "Bucket or object key missing", http.StatusBadRequest)
		return
	}

	bucket := parts[0]
	objectKey := parts[1]

	destPath := filepath.Join(s.localStorageDir, bucket, objectKey)
	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		http.Error(w, fmt.Sprintf("Failed creating directory: %v", err), http.StatusInternalServerError)
		return
	}

	dstFile, err := os.Create(destPath)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed creating file: %v", err), http.StatusInternalServerError)
		return
	}
	defer dstFile.Close()

	written, err := io.Copy(dstFile, r.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed writing stream: %v", err), http.StatusInternalServerError)
		return
	}

	log.Printf("[Mock S3] Received and saved %d bytes for key: %s/%s", written, bucket, objectKey)

	w.Header().Set("ETag", fmt.Sprintf("\"mock-etag-%d\"", time.Now().UnixNano()))
	w.WriteHeader(http.StatusOK)
}

// HandleMockDownload serves uploaded files for preview in the dashboard
func (s *S3Storage) HandleMockDownload(w http.ResponseWriter, r *http.Request) {
	prefix := "/api/v1/storage/file/"
	subPath := strings.TrimPrefix(r.URL.Path, prefix)
	parts := strings.SplitN(subPath, "/", 2)
	if len(parts) < 2 {
		http.Error(w, "Missing file path", http.StatusBadRequest)
		return
	}

	destPath := filepath.Join(s.localStorageDir, parts[0], parts[1])
	http.ServeFile(w, r, destPath)
}
