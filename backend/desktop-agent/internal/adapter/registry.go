package adapter

import (
	"fmt"
	"sync"
)

type AdapterRegistry struct {
	mu            sync.RWMutex
	adapters      map[string]CameraAdapter
	activeAdapter CameraAdapter
}

func NewAdapterRegistry() *AdapterRegistry {
	return &AdapterRegistry{
		adapters: make(map[string]CameraAdapter),
	}
}

func (r *AdapterRegistry) Register(adapter CameraAdapter) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.adapters[adapter.ID()] = adapter
	if r.activeAdapter == nil {
		r.activeAdapter = adapter
	}
}

func (r *AdapterRegistry) Get(id string) (CameraAdapter, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	adapter, exists := r.adapters[id]
	if !exists {
		return nil, fmt.Errorf("adapter with id %s not found", id)
	}
	return adapter, nil
}

func (r *AdapterRegistry) SetActive(id string) (CameraAdapter, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	adapter, exists := r.adapters[id]
	if !exists {
		return nil, fmt.Errorf("adapter with id %s not found", id)
	}

	r.activeAdapter = adapter
	return adapter, nil
}

func (r *AdapterRegistry) GetActive() CameraAdapter {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.activeAdapter
}

func (r *AdapterRegistry) List() []CameraAdapter {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []CameraAdapter
	for _, a := range r.adapters {
		list = append(list, a)
	}
	return list
}
