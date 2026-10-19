package services

import (
	"context"

	"github.com/c2c/api/internal/models"
	"github.com/c2c/api/internal/repositories"
	"github.com/google/uuid"
)

type SessionService struct {
	repo repositories.SessionRepository
}

func NewSessionService(repo repositories.SessionRepository) *SessionService {
	return &SessionService{repo: repo}
}

func (s *SessionService) CreateSession(ctx context.Context, projectID, title, location string) (*models.ShootSession, error) {
	session := &models.ShootSession{
		ID:          uuid.New().String(),
		ProjectID:   projectID,
		Title:       title,
		SessionDate: "2026-10-18",
		Location:    location,
		IsLive:      true,
	}

	if err := s.repo.Create(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

func (s *SessionService) ListSessions(ctx context.Context, projectID string) ([]models.ShootSession, error) {
	return s.repo.List(ctx, projectID)
}

func (s *SessionService) GetSession(ctx context.Context, id string) (*models.ShootSession, error) {
	return s.repo.GetByID(ctx, id)
}
