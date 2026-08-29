# 一键启动并守护 serveo 公网隧道（自动重连）
# 用法：右键“使用 PowerShell 运行”，或 pwsh -File start-tunnel.ps1
# 说明：免费隧道断连后自动重连，每次重连子域名会变化，控制台会打印最新网址。
#       请保持本窗口开启，并保持本地服务 node serve.mjs 运行。
# 更稳定的正式交付请使用 方案A/B（宝塔/Docker 部署自有服务器），见 docs/部署方案.md

$tunnelUrl = $null
$count = 0

function Wait-LocalServer {
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:4173/" -UseBasicParsing -TimeoutSec 3
      if ($r.StatusCode -eq 200) { return $true }
    } catch { Start-Sleep -Seconds 1 }
  }
  return $false
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  AI StockLink 公网隧道（serveo.net 免费版，自动重连）" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

if (-not (Wait-LocalServer)) {
  Write-Host "[错误] 本地服务未运行！请先在项目目录执行: node serve.mjs" -ForegroundColor Red
  exit 1
}
Write-Host "[OK] 本地服务运行中 (http://127.0.0.1:4173)" -ForegroundColor Green

while ($true) {
  $count++
  Write-Host "" -ForegroundColor Gray
  Write-Host "[$count] 正在建立隧道，请稍候..." -ForegroundColor Yellow

  $sshOutput = & ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=25 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R 80:localhost:4173 serveo.net 2>&1
  # 提取网址
  foreach ($line in $sshOutput) {
    if ($line -match 'https://([a-z0-9]+-223-99-205-222\.serveousercontent\.com)') {
      $tunnelUrl = $matches[1]
      Write-Host "  最新公网地址: https://$tunnelUrl" -ForegroundColor Green
      Write-Host "  （复制给老师/同学即可访问；保持本窗口开启）" -ForegroundColor DarkGray
    }
  }
  if ($null -eq $tunnelUrl) {
    Write-Host "[$count] 未获取到网址，隧道可能被限流，5 秒后重试..." -ForegroundColor Yellow
  } else {
    Write-Host "[$count] 隧道已断开，5 秒后自动重连（子域名会变化）..." -ForegroundColor Yellow
  }
  Start-Sleep -Seconds 5
}
