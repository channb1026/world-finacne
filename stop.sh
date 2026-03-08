#!/usr/bin/env bash
# 停止前后端服务：优先用 start.sh 生成的 .pid 文件，否则按端口查找进程（后端 3000，前端 5173）
# 用法：./stop.sh [backend|frontend] 不传参数则停止两者

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

BACKEND_PORT="${PORT:-3000}"
FRONTEND_PORT="5173"
BACKEND_PID_FILE="backend/backend.pid"
FRONTEND_PID_FILE="frontend/frontend.pid"

kill_by_pid() {
  local pid=$1
  local name=$2
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null && echo "已发送 SIGTERM 至 $name (PID $pid)"
    for _ in 1 2 3 4 5; do
      sleep 1
      kill -0 "$pid" 2>/dev/null || break
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null && echo "已强制结束 $name (PID $pid)" || true
    fi
  else
    echo "$name PID $pid 已不存在"
  fi
}

kill_by_port() {
  local port=$1
  local name=$2
  local pids
  pids=$(lsof -ti ":$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill 2>/dev/null && echo "已停止 $name (端口 $port)" || true
    sleep 1
    pids=$(lsof -ti ":$port" 2>/dev/null)
    [ -n "$pids" ] && echo "$pids" | xargs kill -9 2>/dev/null && echo "已强制结束占用端口 $port 的进程" || true
  else
    echo "端口 $port 无占用，跳过 $name"
  fi
}

do_backend() {
  if [ -f "$BACKEND_PID_FILE" ]; then
    pid=$(cat "$BACKEND_PID_FILE")
    kill_by_pid "$pid" "后端"
    rm -f "$BACKEND_PID_FILE"
    if kill -0 "$pid" 2>/dev/null; then
      kill_by_port "$BACKEND_PORT" "后端"
    fi
  else
    kill_by_port "$BACKEND_PORT" "后端"
  fi
}

do_frontend() {
  if [ -f "$FRONTEND_PID_FILE" ]; then
    pid=$(cat "$FRONTEND_PID_FILE")
    kill_by_pid "$pid" "前端"
    rm -f "$FRONTEND_PID_FILE"
    if kill -0 "$pid" 2>/dev/null; then
      kill_by_port "$FRONTEND_PORT" "前端"
    fi
  else
    kill_by_port "$FRONTEND_PORT" "前端"
  fi
}

case "${1:-}" in
  backend)  do_backend ;;
  frontend) do_frontend ;;
  *)
    do_backend
    do_frontend
    echo "停止完成。"
    ;;
esac
