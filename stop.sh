#!/usr/bin/env bash
# 停止前后端服务：优先用 start.sh 生成的 .pid 文件，否则按端口查找进程（后端 3000，前端 5173）

cd "$(dirname "$0")"

BACKEND_PORT="${PORT:-3000}"
FRONTEND_PORT="5173"

# 后端
if [ -f backend/backend.pid ]; then
  pid=$(cat backend/backend.pid)
  if kill "$pid" 2>/dev/null; then
    echo "已停止后端 (PID $pid)"
  else
    echo "后端 PID $pid 未运行，尝试按端口 $BACKEND_PORT 查找..."
    pids=$(lsof -ti ":$BACKEND_PORT" 2>/dev/null)
    [ -n "$pids" ] && echo "$pids" | xargs kill 2>/dev/null && echo "已停止占用 $BACKEND_PORT 的进程" || true
  fi
  rm -f backend/backend.pid
else
  pids=$(lsof -ti ":$BACKEND_PORT" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill 2>/dev/null && echo "已停止后端 (端口 $BACKEND_PORT)" || echo "无法停止端口 $BACKEND_PORT 上的进程"
  else
    echo "未找到 backend.pid，且端口 $BACKEND_PORT 无占用，跳过后端"
  fi
fi

# 前端
if [ -f frontend/frontend.pid ]; then
  pid=$(cat frontend/frontend.pid)
  if kill "$pid" 2>/dev/null; then
    echo "已停止前端 (PID $pid)"
  else
    echo "前端 PID $pid 未运行，尝试按端口 $FRONTEND_PORT 查找..."
    pids=$(lsof -ti ":$FRONTEND_PORT" 2>/dev/null)
    [ -n "$pids" ] && echo "$pids" | xargs kill 2>/dev/null && echo "已停止占用 $FRONTEND_PORT 的进程" || true
  fi
  rm -f frontend/frontend.pid
else
  pids=$(lsof -ti ":$FRONTEND_PORT" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill 2>/dev/null && echo "已停止前端 (端口 $FRONTEND_PORT)" || echo "无法停止端口 $FRONTEND_PORT 上的进程"
  else
    echo "未找到 frontend.pid，且端口 $FRONTEND_PORT 无占用，跳过前端"
  fi
fi
