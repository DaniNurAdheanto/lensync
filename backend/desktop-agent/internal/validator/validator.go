package validator

import (
	"fmt"
	"log"
	"os"
	"time"
)

type FileValidator struct {
	minFileAge    time.Duration
	stabilityWait time.Duration
	maxAttempts   int
}

func NewFileValidator(minFileAgeMs int, stabilityWaitMs int) *FileValidator {
	if minFileAgeMs <= 0 {
		minFileAgeMs = 500
	}
	if stabilityWaitMs <= 0 {
		stabilityWaitMs = 250
	}

	return &FileValidator{
		minFileAge:    time.Duration(minFileAgeMs) * time.Millisecond,
		stabilityWait: time.Duration(stabilityWaitMs) * time.Millisecond,
		maxAttempts:   10,
	}
}

// ValidateFileReady verifies that a photo file has completely finished being written by the camera
// tethering software (e.g. EOS Utility, Capture One, Sony Imaging Edge) or the operating system.
// It ensures:
// 1. File exists and is not empty (Size > 0)
// 2. Minimum file age has passed since modification time
// 3. File size is completely stable across consecutive checks (no partial buffer flush)
// 4. File can be opened without locking errors
func (v *FileValidator) ValidateFileReady(filePath string) (int64, error) {
	initialInfo, err := os.Stat(filePath)
	if err != nil {
		return 0, fmt.Errorf("unable to stat file %s: %w", filePath, err)
	}

	if initialInfo.IsDir() {
		return 0, fmt.Errorf("path is a directory: %s", filePath)
	}

	if initialInfo.Size() == 0 {
		return 0, fmt.Errorf("file is empty (0 bytes): %s", filePath)
	}

	// 1. Check minimum file age
	if age := time.Since(initialInfo.ModTime()); age < v.minFileAge {
		// Wait remaining time up to minFileAge
		time.Sleep(v.minFileAge - age)
	}

	// 2. Multi-sample size stability check
	lastSize := initialInfo.Size()
	for attempt := 1; attempt <= v.maxAttempts; attempt++ {
		time.Sleep(v.stabilityWait)

		currentInfo, err := os.Stat(filePath)
		if err != nil {
			return 0, fmt.Errorf("stat failed during stability check for %s: %w", filePath, err)
		}

		currentSize := currentInfo.Size()
		if currentSize == lastSize && currentSize > 0 {
			// File size has stabilized!
			// 3. Attempt shared read open to ensure no exclusive write locks
			file, err := os.Open(filePath)
			if err != nil {
				log.Printf("[Validator] File %s still locked by another process (attempt %d/%d)", filePath, attempt, v.maxAttempts)
				continue
			}
			file.Close()

			return currentSize, nil
		}

		log.Printf("[Validator] File %s still growing (%d -> %d bytes, attempt %d/%d)", filePath, lastSize, currentSize, attempt, v.maxAttempts)
		lastSize = currentSize
	}

	return 0, fmt.Errorf("file size did not stabilize after %d checks: %s", v.maxAttempts, filePath)
}
