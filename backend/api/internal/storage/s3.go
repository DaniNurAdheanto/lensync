package storage

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"fmt"
	"net/url"
	"time"
)

type S3Storage struct {
	endpoint   string
	accessKey  string
	secretKey  string
	bucketName string
	useSSL     bool
}

func NewS3Storage(endpoint, accessKey, secretKey, bucketName string, useSSL bool) *S3Storage {
	return &S3Storage{
		endpoint:   endpoint,
		accessKey:  accessKey,
		secretKey:  secretKey,
		bucketName: bucketName,
		useSSL:     useSSL,
	}
}

// GeneratePresignedPutURL creates a standard S3/MinIO compatible presigned PUT URL
func (s *S3Storage) GeneratePresignedPutURL(objectKey string, expiryDuration time.Duration) (string, error) {
	scheme := "http"
	if s.useSSL {
		scheme = "https"
	}

	expires := time.Now().Add(expiryDuration).Unix()
	stringToSign := fmt.Sprintf("PUT\n\n\n%d\n/%s/%s", expires, s.bucketName, objectKey)

	mac := hmac.New(sha1.New, []byte(s.secretKey))
	mac.Write([]byte(stringToSign))
	signature := base64.StdEncoding.EncodeToString(mac.Sum(nil))

	query := url.Values{}
	query.Set("AWSAccessKeyId", s.accessKey)
	query.Set("Signature", signature)
	query.Set("Expires", fmt.Sprintf("%d", expires))

	presignedURL := fmt.Sprintf("%s://%s/%s/%s?%s", scheme, s.endpoint, s.bucketName, objectKey, query.Encode())
	return presignedURL, nil
}

func (s *S3Storage) GetBucketName() string {
	return s.bucketName
}
