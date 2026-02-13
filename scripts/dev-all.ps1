Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $repoRoot ".runtime"
$pidFile = Join-Path $runtimeDir "dev-pids.json"
$apiOut = Join-Path $runtimeDir "dev-api.out.log"
$apiErr = Join-Path $runtimeDir "dev-api.err.log"
$webOut = Join-Path $runtimeDir "dev-web.out.log"
$webErr = Join-Path $runtimeDir "dev-web.err.log"

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

if (Test-Path $pidFile) {
  $existingState = Get-Content -Raw $pidFile | ConvertFrom-Json
  $runningProcesses = @()

  foreach ($proc in @($existingState.processes)) {
    $running = Get-Process -Id ([int]$proc.pid) -ErrorAction SilentlyContinue
    if ($null -ne $running) {
      $runningProcesses += $proc
    }
  }

  if ($runningProcesses.Count -gt 0) {
    Write-Host "Development services are already running."
    Write-Host "Run 'npm run dev:stop' first if you want to restart them."
    exit 0
  }

  Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}

Set-Location $repoRoot
Write-Host "Running migrations before startup..."
& npm.cmd run migrate
if ($LASTEXITCODE -ne 0) {
  throw "Migration command failed."
}

function Start-DevProcess {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$NpmScript,
    [Parameter(Mandatory = $true)][string]$StdOutPath,
    [Parameter(Mandatory = $true)][string]$StdErrPath
  )

  $process = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", $NpmScript) `
    -WorkingDirectory $repoRoot `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $StdOutPath `
    -RedirectStandardError $StdErrPath

  return [pscustomobject]@{
    name = $Name
    script = $NpmScript
    pid = $process.Id
    stdout = $StdOutPath
    stderr = $StdErrPath
  }
}

$apiProcess = Start-DevProcess -Name "api" -NpmScript "dev:api" -StdOutPath $apiOut -StdErrPath $apiErr
$webProcess = Start-DevProcess -Name "web" -NpmScript "dev:web" -StdOutPath $webOut -StdErrPath $webErr

Start-Sleep -Milliseconds 900

$failedStarts = @()
foreach ($proc in @($apiProcess, $webProcess)) {
  $running = Get-Process -Id ([int]$proc.pid) -ErrorAction SilentlyContinue
  if ($null -eq $running) {
    $failedStarts += $proc
  }
}

if ($failedStarts.Count -gt 0) {
  foreach ($proc in @($apiProcess, $webProcess)) {
    Stop-Process -Id ([int]$proc.pid) -Force -ErrorAction SilentlyContinue
  }

  throw "One or more services failed to start. Check .runtime/*.err.log (common cause: port already in use)."
}

$state = [pscustomobject]@{
  startedAt = (Get-Date).ToString("o")
  apiPort = if ($env:API_PORT) { $env:API_PORT } else { "4000" }
  webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { "3000" }
  processes = @($apiProcess, $webProcess)
}

$state | ConvertTo-Json -Depth 6 | Set-Content -Path $pidFile -Encoding utf8

Write-Host "Development services started."
Write-Host ("Web: http://127.0.0.1:{0}" -f $state.webPort)
Write-Host ("API: http://127.0.0.1:{0}" -f $state.apiPort)
Write-Host "Use 'npm run dev:stop' to stop both services."
