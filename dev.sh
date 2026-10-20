#!/usr/bin/env bash

# Lensync: Camera-to-Cloud Development Runner Script
# Usage: ./dev.sh [start|stop|restart|status]

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$PROJECT_ROOT/.logs"
mkdir -p "$LOGS_DIR"

API_PID_FILE="$LOGS_DIR/api.pid"
AGENT_PID_FILE="$LOGS_DIR/agent.pid"
WEB_PID_FILE="$LOGS_DIR/web.pid"

check_port() {
  local port=$1
  lsof -i :"$port" -sTCP:LISTEN -t >/dev/null 2>&1
}

start_api() {
  if check_port 8080; then
    echo "⚡ [API Server] Port 8080 sudah aktif."
  else
    echo "🚀 [API Server] Menjalankan Go API Server di port 8080..."
    (cd "$PROJECT_ROOT/backend/api" && go run cmd/server/main.go > "$LOGS_DIR/api.log" 2>&1) &
    echo $! > "$API_PID_FILE"
    sleep 2
    if check_port 8080; then
      echo "✅ [API Server] Siap di http://localhost:8080"
    else
      echo "⚠️  [API Server] Sedang booting (cek log: .logs/api.log)"
    fi
  fi
}

start_agent() {
  if check_port 8081; then
    echo "📷 [Desktop Agent] Port 8081 sudah aktif."
  else
    echo "🚀 [Desktop Agent] Menjalankan Local Sync Agent di port 8081..."
    (cd "$PROJECT_ROOT/backend/desktop-agent" && go run cmd/agent/main.go --config=config.example.yaml > "$LOGS_DIR/agent.log" 2>&1) &
    echo $! > "$AGENT_PID_FILE"
    sleep 2
    if check_port 8081; then
      echo "✅ [Desktop Agent] Siap di http://localhost:8081"
    else
      echo "⚠️  [Desktop Agent] Sedang booting (cek log: .logs/agent.log)"
    fi
  fi
}

start_web() {
  if check_port 3001; then
    echo "💻 [Frontend Web] Port 3001 sudah aktif."
  else
    echo "🚀 [Frontend Web] Menjalankan Next.js Web di port 3001..."
    (cd "$PROJECT_ROOT/frontend" && npm run dev > "$LOGS_DIR/web.log" 2>&1) &
    echo $! > "$WEB_PID_FILE"
    sleep 2
    if check_port 3001; then
      echo "✅ [Frontend Web] Siap di http://localhost:3001"
    else
      echo "⚠️  [Frontend Web] Sedang booting (cek log: .logs/web.log)"
    fi
  fi
}

status() {
  echo "=========================================================="
  echo "📡 Status Layanan Lensync: Camera-to-Cloud"
  echo "=========================================================="
  
  if check_port 8080; then
    echo "🟢 API Server      : BERJALAN di http://localhost:8080"
  else
    echo "🔴 API Server      : MATI (Port 8080)"
  fi

  if check_port 8081; then
    echo "🟢 Desktop Agent   : BERJALAN di http://localhost:8081"
  else
    echo "🔴 Desktop Agent   : MATI (Port 8081)"
  fi

  if check_port 3001; then
    echo "🟢 Frontend Web    : BERJALAN di http://localhost:3001"
  else
    echo "🔴 Frontend Web    : MATI (Port 3001)"
  fi

  echo "----------------------------------------------------------"
  echo "🔗 Tautan Langsung:"
  echo "  👉 Dashboard Fotografer : http://localhost:3001/dashboard"
  echo "  👉 Portal Proofing Klien: http://localhost:3001/proof/session-pfw-2026"
  echo "  👉 Landing Page         : http://localhost:3001"
  echo "=========================================================="
}

stop_all() {
  echo "🛑 Menghentikan semua layanan Lensync..."
  
  for port in 8080 8081 3001; do
    local pids=$(lsof -t -i :"$port" 2>/dev/null)
    if [ -n "$pids" ]; then
      echo "Mematikan proses di port $port (PID: $pids)..."
      kill -9 $pids 2>/dev/null
    fi
  done

  rm -f "$API_PID_FILE" "$AGENT_PID_FILE" "$WEB_PID_FILE"
  echo "✅ Semua layanan telah dihentikan."
}

case "$1" in
  start)
    start_api
    start_agent
    start_web
    echo ""
    status
    ;;
  stop)
    stop_all
    ;;
  restart)
    stop_all
    sleep 2
    start_api
    start_agent
    start_web
    echo ""
    status
    ;;
  status)
    status
    ;;
  *)
    echo "Penggunaan: ./dev.sh [start|stop|restart|status]"
    echo ""
    status
    ;;
esac
