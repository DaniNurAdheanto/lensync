.PHONY: up down api agent web contracts test help

help:
	@echo "Camera-to-Cloud (C2C) Monorepo Developer Commands:"
	@echo "  make up        - Start local infrastructure (PostgreSQL & MinIO S3)"
	@echo "  make down      - Stop local infrastructure"
	@echo "  make api       - Run backend Go REST API server"
	@echo "  make agent     - Run desktop photo ingestion agent (Go)"
	@echo "  make web       - Run Next.js frontend web dashboard"
	@echo "  make migrate   - Execute PostgreSQL initial schema migrations"

up:
	docker compose -f infrastructure/docker-compose.yml up -d

down:
	docker compose -f infrastructure/docker-compose.yml down

api:
	cd services/api && go run cmd/server/main.go

agent:
	cd apps/desktop-agent && go run cmd/agent/main.go --config=config.example.yaml

web:
	cd apps/web && npm run dev

test:
	cd services/api && go test ./...
	cd apps/desktop-agent && go test ./...
