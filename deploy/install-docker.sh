#!/bin/bash
# ============================================================
# AI StockLink 一键部署脚本（Ubuntu/Debian + Docker Compose）
# 用法：
#   有域名:  bash install-docker.sh aistock.你的域名.com
#   无域名:  bash install-docker.sh            （http://服务器IP:4173 直接访问）
# 说明：
#   - 自动安装 Docker → 构建项目 → 启动服务
#   - 有域名时 Caddy 自动申请/续期 Let's Encrypt HTTPS 证书
#   - 域名需提前解析 A 记录到本服务器公网 IP
# ============================================================
set -e

DOMAIN="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "======================================================"
echo " AI StockLink 一键部署"
echo " 项目目录: $ROOT"
[ -n "$DOMAIN" ] && echo " 域名: $DOMAIN (请确认 A 记录已解析到本机公网 IP)"
[ -z "$DOMAIN" ] && echo " 模式: 无域名（IP 直连 http://IP:4173，可稍后绑定域名开启 HTTPS）"
echo "======================================================"

# 1. 安装 Docker（未安装时）
if ! command -v docker >/dev/null 2>&1; then
  echo "[1/4] 安装 Docker..."
  curl -fsSL https://get.docker.com | bash
  systemctl enable --now docker || true
else
  echo "[1/4] Docker 已安装: $(docker --version)"
fi

# 2. 配置域名（替换 Caddyfile 占位域名）
cd "$ROOT"
if [ -n "$DOMAIN" ]; then
  echo "[2/4] 写入域名 $DOMAIN 到 Caddyfile..."
  sed -i "s/aistock\.你的域名\.com/$DOMAIN/g" deploy/Caddyfile
else
  echo "[2/4] 无域名模式，跳过 Caddy 配置（仅启动 app 服务）"
fi

# 3. 构建并启动
echo "[3/4] 构建镜像并启动服务（首次构建约需 2-5 分钟）..."
if [ -n "$DOMAIN" ]; then
  docker compose up -d --build
else
  docker compose up -d --build app
fi

# 4. 自检并输出地址
echo "[4/4] 自检服务状态..."
sleep 3
if docker ps | grep -q aistocklink; then
  echo "✅ 服务运行中"
else
  echo "⚠️  服务未运行，请查看: docker compose logs app"
fi

echo ""
echo "======================================================"
if [ -n "$DOMAIN" ]; then
  echo "🎉 部署完成！访问地址: https://$DOMAIN"
  echo "   （Caddy 首次访问会自动申请证书，约 10-30 秒）"
else
  IP="$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')"
  echo "🎉 部署完成！访问地址: http://$IP:4173"
  echo "   （绑定域名并修改 deploy/Caddyfile 后可启用 HTTPS）"
fi
echo " 常用命令: docker compose ps / logs / up -d --build"
echo "======================================================"
