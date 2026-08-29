$pages = @(
  @{ name = 'home'; url = 'https://gupiao.yaozhineng.com/' },
  @{ name = 'search'; url = 'https://gupiao.yaozhineng.com/search' },
  @{ name = 'stock_600519'; url = 'https://gupiao.yaozhineng.com/stock/600519' },
  @{ name = 'forecast'; url = 'https://gupiao.yaozhineng.com/forecast' },
  @{ name = 'tenx'; url = 'https://gupiao.yaozhineng.com/tenx' },
  @{ name = 'trend'; url = 'https://gupiao.yaozhineng.com/trend' },
  @{ name = 'monitor'; url = 'https://gupiao.yaozhineng.com/monitor' },
  @{ name = 'hot_burst'; url = 'https://gupiao.yaozhineng.com/hot-burst' },
  @{ name = 'stock_intel'; url = 'https://gupiao.yaozhineng.com/stock-intel' },
  @{ name = 'update_logs'; url = 'https://gupiao.yaozhineng.com/update-logs' },
  @{ name = 'download'; url = 'https://gupiao.yaozhineng.com/download' },
  @{ name = 'favorites'; url = 'https://gupiao.yaozhineng.com/favorites' }
)
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$outDir = 'C:\Users\28129\Desktop\项目\shots'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
foreach ($p in $pages) {
  $shot = Join-Path $outDir ($p.name + '.png')
  & $chrome --headless=new --disable-gpu --no-sandbox --window-size=1440,2200 --hide-scrollbars --virtual-time-budget=12000 --screenshot=$shot $p.url 2>$null | Out-Null
  if (Test-Path $shot) { Write-Output ("{0}: {1} bytes" -f $p.name, (Get-Item $shot).Length) } else { Write-Output ("{0}: FAILED" -f $p.name) }
}
