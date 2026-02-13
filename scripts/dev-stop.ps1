Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $repoRoot ".runtime"
$pidFile = Join-Path $runtimeDir "dev-pids.json"

if (-not (Test-Path $pidFile)) {
  Write-Host "No tracked development services are running."
  exit 0
}

$state = Get-Content -Raw $pidFile | ConvertFrom-Json
$stoppedCount = 0

foreach ($proc in @($state.processes)) {
  $processId = [int]$proc.pid
  $running = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($null -eq $running) {
    continue
  }

  Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  $stoppedCount += 1
  Write-Host ("Stopped {0} (PID {1})." -f $proc.name, $processId)
}

Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
Write-Host ("Done. Stopped {0} process(es)." -f $stoppedCount)
