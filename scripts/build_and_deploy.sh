#!/usr/bin/env bash
set -euo pipefail

echo "=== 1) Build images ==="
docker compose build

echo ""
echo "=== 2) Validate docker-compose config ==="
docker compose config --quiet && echo "Config OK"

echo ""
echo "=== 3) Scan images for vulnerabilities ==="
echo "Scanning tp_final-api..."
docker scout quickview tp_final-api 2>/dev/null || echo "(Docker Scout not available, skipping)"
echo "Scanning tp_final-front..."
docker scout quickview tp_final-front 2>/dev/null || echo "(Docker Scout not available, skipping)"

echo ""
echo "=== 4) Deploy stack ==="
docker compose up -d

echo ""
echo "=== 5) Status ==="
docker compose ps

echo ""
echo "Stack deployed successfully!"
echo "  - Frontend: http://localhost:8080"
echo "  - API:      http://localhost:8000"

# === Optional: Push signed images to registry ===
# Uncomment and configure for CI/CD
# if [ -n "${DOCKER_REGISTRY:-}" ]; then
#   echo "=== Pushing images with Content Trust ==="
#   export DOCKER_CONTENT_TRUST=1
#   docker tag tp_final-api "${DOCKER_REGISTRY}/tp_final-api:latest"
#   docker tag tp_final-front "${DOCKER_REGISTRY}/tp_final-front:latest"
#   docker push "${DOCKER_REGISTRY}/tp_final-api:latest"
#   docker push "${DOCKER_REGISTRY}/tp_final-front:latest"
# fi
