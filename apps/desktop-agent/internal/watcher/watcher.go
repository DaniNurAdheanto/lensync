package watcher

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type DetectedPhoto struct {
	FilePath     string
	FileName     string
	Extension    string
	SizeBytes    int64
	SHA256Hash   string
	DiscoveredAt time.Time
}

type FileWatcher struct {
	watchPath         string
	allowedExtensions map[string]bool
	pollInterval      time.Duration
	minFileAge        time.Duration
	seenFiles         map[string]bool
	mu                sync.RWMutex
	stopChan          chan struct{}
}

func NewFileWatcher(path string, extensions []string, pollIntervalMs int, minFileAgeMs int) *FileWatcher {
	extMap := make(map[string]bool)
	for _, ext := range extensions {
		extMap[strings.ToLower(ext)] = true
	}

	return &FileWatcher{
		watchPath:         path,
		allowedExtensions: extMap,
		pollInterval:      time.Duration(pollIntervalMs) * time.Millisecond,
		minFileAge:        time.Duration(minFileAgeMs) * time.Millisecond,
		seenFiles:         make(map[string]bool),
		stopChan:          make(chan struct{}),
	}
}

// Start begins the folder polling / file system event loop
func (w *FileWatcher) Start(outputChan chan<- DetectedPhoto) {
	log.Printf("[Watcher] Starting watch on directory: %s", w.watchPath)

	// Ensure directory exists
	if err := os.MkdirAll(w.watchPath, 0755); err != nil {
		log.Printf("[Watcher] Warning: unable to create watch directory %s: %v", w.watchPath, err)
	}

	ticker := time.NewTicker(w.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-w.stopChan:
			log.Println("[Watcher] Stopping watcher loop.")
			return
		case <-ticker.C:
			w.scanDirectory(outputChan)
		}
	}
}

func (w *FileWatcher) Stop() {
	close(w.stopChan)
}

func (w *FileWatcher) scanDirectory(outputChan chan<- DetectedPhoto) {
	entries, err := os.ReadDir(w.watchPath)
	if err != nil {
		log.Printf("[Watcher] Error reading directory %s: %v", w.watchPath, err)
		return
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		fileName := entry.Name()
		ext := strings.ToLower(filepath.Ext(fileName))

		if !w.allowedExtensions[ext] {
			continue
		}

		fullPath := filepath.Join(w.watchPath, fileName)

		w.mu.RLock()
		alreadyProcessed := w.seenFiles[fullPath]
		w.mu.RUnlock()

		if alreadyProcessed {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Verify file writing has finished (camera tethering buffer complete)
		if time.Since(info.ModTime()) < w.minFileAge {
			continue
		}

		// Calculate SHA-256 for deduplication
		hashStr, err := calculateSHA256(fullPath)
		if err != nil {
			log.Printf("[Watcher] Failed hashing file %s: %v", fullPath, err)
			continue
		}

		w.mu.Lock()
		w.seenFiles[fullPath] = true
		w.mu.Unlock()

		log.Printf("[Watcher] New photo detected: %s (%d bytes, hash: %s)", fileName, info.Size(), hashStr[:8])

		outputChan <- DetectedPhoto{
			FilePath:     fullPath,
			FileName:     fileName,
			Extension:    ext,
			SizeBytes:    info.Size(),
			SHA256Hash:   hashStr,
			DiscoveredAt: time.Now(),
		}
	}
}

func calculateSHA256(filePath string) (string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hasher.Sum(nil)), nil
}
