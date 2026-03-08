#!/usr/bin/env bash
# 使用 nohup 启动前后端服务，日志写入各目录下的 .log 文件
# 若对应 .pid 存在且进程存活则跳过该服务；停止请用 ./stop.sh

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

BACKEND_PID_FILE="backend/backend.pid"
FRONTEND_PID_FILE="frontend/frontend.pid"

pid_alive() { kill -0 "$1" 2>/dev/null; }

# 后端
echo "启动后端..."
if [ -f "$BACKEND_PID_FILE" ]; then
  bp=$(cat "$BACKEND_PID_FILE")
  if pid_alive "$bp"; then
    echo "  后端已在运行 (PID $bp)，跳过。若需重启请先执行 ./stop.sh"
  else
    rm -f "$BACKEND_PID_FILE"
    (cd backend && nohup npm start >> backend.log 2>&1 & sleep 0.5 && echo $! > backend.pid)
    echo "  后端 PID: $(cat "$BACKEND_PID_FILE" 2>/dev/null || echo '?')，日志: backend/backend.log"
  fi
else
  (cd backend && nohup npm start >> backend.log 2>&1 & sleep 0.5 && echo $! > backend.pid)
  echo "  后端 PID: $(cat "$BACKEND_PID_FILE" 2>/dev/null || echo '?')，日志: backend/backend.log"
fi

# 前端
echo "启动前端..."
if [ -f "$FRONTEND_PID_FILE" ]; then
  fp=$(cat "$FRONTEND_PID_FILE")
  if pid_alive "$fp"; then
    echo "  前端已在运行 (PID $fp)，跳过。若需重启请先执行 ./stop.sh"
  else
    rm -f "$FRONTEND_PID_FILE"
    (cd frontend && nohup npm run dev >> frontend.log 2>&1 & sleep 0.5 && echo $! > frontend.pid)
    echo "  前端 PID: $(cat "$FRONTEND_PID_FILE" 2>/dev/null || echo '?')，日志: frontend/frontend.log"
  fi
else
  (cd frontend && nohup npm run dev >> frontend.log 2>&1 & sleep 0.5 && echo $! > frontend.pid)
  echo "  前端 PID: $(cat "$FRONTEND_PID_FILE" 2>/dev/null || echo '?')，日志: frontend/frontend.log"
fi

echo ""
echo "前后端已后台启动。停止方式："
echo "  ./stop.sh"
echo "  或手动：kill \$(cat backend/backend.pid)  # 停后端"
echo "         kill \$(cat frontend/frontend.pid)  # 停前端"
