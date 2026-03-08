#!/usr/bin/env bash
# 使用 nohup 启动前后端服务，日志写入各目录下的 .log 文件

set -e
cd "$(dirname "$0")"

echo "启动后端..."
(cd backend && nohup npm start >> backend.log 2>&1 & echo $! > backend.pid)
echo "后端 PID: $(cat backend/backend.pid)，日志: backend/backend.log"

echo "启动前端..."
(cd frontend && nohup npm run dev >> frontend.log 2>&1 & echo $! > frontend.pid)
echo "前端 PID: $(cat frontend/frontend.pid)，日志: frontend/frontend.log"

echo ""
echo "前后端已后台启动。停止方式："
echo "  kill \$(cat backend/backend.pid)   # 停后端"
echo "  kill \$(cat frontend/frontend.pid)  # 停前端"
