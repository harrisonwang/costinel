#!/bin/bash

set -Eeuo pipefail
umask 027

# ============ 配置区 ============
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR_OVERRIDE:-$(cd "$SCRIPT_DIR/.." && pwd)}"
LOG_FILE="/var/log/costinel/stock-monitor.log"
LOCK_FILE="/run/costinel-stock.lock"
NODE_BIN="${NODE_BIN:-/root/.nvm/versions/node/v22.20.0/bin/node}"
TIMEOUT_DURATION="10m"

# ============ 锁文件（防并发）============
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "[$(date '+%F %T %Z')] 股票监控已经在运行中，跳过本次执行" >> "$LOG_FILE" 2>&1 || true
    exit 0
fi

# ============ 清理函数 ============
cleanup() {
    flock -u 9 2>/dev/null || true
}
trap cleanup INT TERM EXIT

# ============ 确保日志目录存在 ============
mkdir -p "$(dirname "$LOG_FILE")"

# ============ 加载环境变量 ============
if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    . "$PROJECT_DIR/.env"
    set +a
fi

# ============ 检查是否为交易日 ============
# 周末检查
day_of_week=$(date +%u)  # 1-7 (周一到周日)
if [ "$day_of_week" -eq 6 ] || [ "$day_of_week" -eq 7 ]; then
    echo "[$(date '+%F %T %Z')] 周末休市，跳过监控" >> "$LOG_FILE" 2>&1
    exit 0
fi

# 检查交易时间 (9:30-15:00)
current_time=$(date +%H%M)
if [ "$current_time" -lt 930 ] || [ "$current_time" -gt 1500 ]; then
    echo "[$(date '+%F %T %Z')] 非交易时间，跳过监控" >> "$LOG_FILE" 2>&1
    exit 0
fi

# ============ 执行股票监控 ============
cd "$PROJECT_DIR"
echo "[$(date '+%F %T %Z')] 开始执行股票监控..." >> "$LOG_FILE" 2>&1

timeout "$TIMEOUT_DURATION" "$NODE_BIN" src/monitors/stock-monitor.js >> "$LOG_FILE" 2>&1

exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo "[$(date '+%F %T %Z')] 股票监控完成" >> "$LOG_FILE" 2>&1
else
    echo "[$(date '+%F %T %Z')] 股票监控失败，退出码: $exit_code" >> "$LOG_FILE" 2>&1
fi

exit $exit_code
