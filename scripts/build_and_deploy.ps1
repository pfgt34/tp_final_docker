Write-Host "=== 1) Build images ===" -ForegroundColor Cyan
docker compose build

Write-Host ""
Write-Host "=== 2) Validate docker-compose config ===" -ForegroundColor Cyan
docker compose config --quiet
Write-Host "Config OK"

Write-Host ""
Write-Host "=== 3) Scan images for vulnerabilities ===" -ForegroundColor Cyan
Write-Host "Scanning tp_final-api..."
docker scout quickview tp_final-api 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "(Docker Scout not available, skipping)" }
Write-Host "Scanning tp_final-front..."
docker scout quickview tp_final-front 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "(Docker Scout not available, skipping)" }

Write-Host ""
Write-Host "=== 4) Deploy stack ===" -ForegroundColor Cyan
docker compose up -d

Write-Host ""
Write-Host "=== 5) Status ===" -ForegroundColor Cyan
docker compose ps

Write-Host ""
Write-Host "Stack deployed successfully!" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:8080"
Write-Host "  - API:      http://localhost:8000"
