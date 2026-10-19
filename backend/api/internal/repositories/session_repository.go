package repositories

import (
	"context"
	"database/sql"

	"github.com/c2c/api/internal/models"
)

type SessionRepository interface {
	Create(ctx context.Context, s *models.ShootSession) error
	GetByID(ctx context.Context, id string) (*models.ShootSession, error)
	List(ctx context.Context, projectID string) ([]models.ShootSession, error)
}

type PostgresSessionRepo struct {
	db *sql.DB
}

func NewPostgresSessionRepo(db *sql.DB) *PostgresSessionRepo {
	return &PostgresSessionRepo{db: db}
}

func (r *PostgresSessionRepo) Create(ctx context.Context, s *models.ShootSession) error {
	query := `
		INSERT INTO shoot_sessions (id, project_id, title, session_date, location, is_live, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id;
	`
	return r.db.QueryRowContext(ctx, query, s.ID, s.ProjectID, s.Title, s.SessionDate, s.Location, s.IsLive).Scan(&s.ID)
}

func (r *PostgresSessionRepo) GetByID(ctx context.Context, id string) (*models.ShootSession, error) {
	query := `SELECT id, project_id, title, session_date, location, is_live, created_at, updated_at FROM shoot_sessions WHERE id = $1;`
	var s models.ShootSession
	err := r.db.QueryRowContext(ctx, query, id).Scan(&s.ID, &s.ProjectID, &s.Title, &s.SessionDate, &s.Location, &s.IsLive, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *PostgresSessionRepo) List(ctx context.Context, projectID string) ([]models.ShootSession, error) {
	query := `
		SELECT id, project_id, title, session_date, location, is_live, created_at, updated_at
		FROM shoot_sessions
		WHERE ($1 = '' OR project_id::text = $1)
		ORDER BY created_at DESC;
	`
	rows, err := r.db.QueryContext(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.ShootSession
	for rows.Next() {
		var s models.ShootSession
		if err := rows.Scan(&s.ID, &s.ProjectID, &s.Title, &s.SessionDate, &s.Location, &s.IsLive, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}
