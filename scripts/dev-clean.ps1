Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." )).Path
Set-Location $repoRoot

Write-Host "[dev:clean] Stopping any tracked development services (if running)..."
& npm.cmd run dev:stop

Write-Host "[dev:clean] Removing local development database (data/iwfsa.db) if it exists..."
$dataDir = Join-Path $repoRoot "data"
$dbPath = Join-Path $dataDir "iwfsa.db"
if (Test-Path $dbPath) {
  Remove-Item -Path $dbPath -Force
  Write-Host "[dev:clean] Removed $dbPath."
} else {
  Write-Host "[dev:clean] No existing database file found (nothing to remove)."
}

Write-Host "[dev:clean] Clearing runtime metadata (.runtime) if present..."
$runtimeDir = Join-Path $repoRoot ".runtime"
if (Test-Path $runtimeDir) {
  Remove-Item -Path $runtimeDir -Recurse -Force
  Write-Host "[dev:clean] Removed .runtime directory."
}

Write-Host "[dev:clean] Running database migrations to create a fresh schema..."
& npm.cmd run migrate
if ($LASTEXITCODE -ne 0) {
  throw "[dev:clean] Migration command failed. Use 'npm run migrate' directly to inspect the error."
}

Write-Host "[dev:clean] Starting API and Web development servers..."
& npm.cmd run dev:all

Write-Host "[dev:clean] Done. If there were startup issues, check .runtime/*.err.log for details."
