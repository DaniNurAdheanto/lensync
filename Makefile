.PHONY: up down api agent web dev test help

help:
	@echo "Lensync: Camera-to-Cloud (C2C) Developer Commands:"
	@echo "  make dev       - Run all 3 services concurrently in background"
	@echo "  make api       - Run Go API server (Port 8080)"
	@echo "  make agent     - Run Go Desktop Sync Agent (Port 8081)"
	@echo "  make web       - Run Next.js Frontend Dashboard (Port 3001)"
	@echo "  make test      - Run Go tests across backend"

api:
	cd backend/api && go run cmd/server/main.go

agent:
	cd backend/desktop-agent && go run cmd/agent/main.go --config=config.example.yaml

web:
	cd frontend && npm run dev

dev:
	@chmod +x ./dev.sh
	@./dev.sh

test:
	cd backend/api && go test ./...
	cd backend/desktop-agent && go test ./...
