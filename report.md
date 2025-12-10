# Rapport de synthèse — TD Application Conteneurisée

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Réseau Docker                            │
│  ┌──────────┐      ┌──────────┐      ┌──────────────────────┐   │
│  │   db     │◄────▶│   api    │◄────▶│       front          │   │
│  │ Postgres │      │ FastAPI  │      │ Nginx (reverse proxy)│   │
│  │ :5432    │      │ :8000    │      │ :80 → exposé :8080   │   │
│  └──────────┘      └──────────┘      └──────────────────────┘   │
│       │                                                          │
│       ▼                                                          │
│  [volume db_data]                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Services

| Service | Image / Build | Rôle |
|---------|---------------|------|
| **db** | `postgres:15-alpine` | Base de données PostgreSQL, initialisée via `init.sql` |
| **api** | Build local `./api` | API Python (FastAPI) exposant `/status` et `/items` |
| **front** | Build local `./front` | Site statique + reverse proxy Nginx vers l'API |

### Flux de données
1. L'utilisateur accède à `http://localhost:8080` (front).
2. Le JavaScript appelle `/api/status` et `/api/items`.
3. Nginx reverse-proxy ces requêtes vers `http://api:8000/`.
4. L'API interroge PostgreSQL et renvoie les données JSON.

---

## 2. Commandes clés

```bash
# Construire les images
docker compose build

# Valider la configuration Compose
docker compose config

# Démarrer la stack en arrière-plan
docker compose up -d

# Voir l'état des services
docker compose ps

# Consulter les logs
docker compose logs -f api

# Arrêter et nettoyer (avec volumes)
docker compose down -v

# Scanner une image (Docker Scout ou Trivy)
docker scout quickview tp_final-api
# ou
trivy image tp_final-api
```

---

## 3. Bonnes pratiques suivies

### 3.1 Dockerfile multi-étapes
- **API** : étape `builder` installe les dépendances dans `/install`, étape finale copie uniquement le nécessaire.
- **Front** : étape `builder` copie les sources, étape finale utilise `nginx:alpine` (~40 MB).

**Économie** : l'image API pèse ~180 MB au lieu de ~1 GB si on gardait les outils de build.

### 3.2 Images légères
- Base `python:3.11-slim` pour l'API.
- Base `nginx:alpine` pour le front.
- Base `postgres:15-alpine` pour la DB.

### 3.3 `.dockerignore`
Fichiers exclus : `__pycache__`, `.env`, `node_modules`, `*.log`, etc.

### 3.4 Utilisateur non-root
```dockerfile
RUN groupadd -r app && useradd -r -g app app
USER app
```
Les processus tournent avec un compte sans privilèges.

### 3.5 Sécurité Compose
```yaml
cap_drop:
  - ALL
security_opt:
  - no-new-privileges:true
read_only: true
tmpfs:
  - /tmp
```

### 3.6 Healthchecks
Chaque service dispose d'un healthcheck pour que Compose attende la disponibilité avant de démarrer les dépendants.

### 3.7 Variables d'environnement
- Fichier `.env` pour centraliser la configuration.
- Section `environment` dans Compose pour passer les variables aux conteneurs.

---

## 4. Signature et scan des images

### Docker Content Trust (signature)
```bash
export DOCKER_CONTENT_TRUST=1
docker push registry.example.com/tp_final-api:latest
```
Nécessite un registre et des clés de signature configurées.

### Scan de vulnérabilités
```bash
# Avec Docker Scout (intégré Docker Desktop)
docker scout cves tp_final-api

# Avec Trivy (open source)
trivy image tp_final-api
```

**Interprétation** : corriger les CVE critiques/élevées en mettant à jour les images de base ou les dépendances.

---

## 5. Script d'automatisation

Le script `scripts/build_and_deploy.sh` (ou `.ps1` pour Windows) :
1. Construit les images (`docker compose build`).
2. Valide la configuration (`docker compose config`).
3. (Optionnel) Scanne les images.
4. (Optionnel) Pousse les images signées vers un registre.
5. Déploie la stack (`docker compose up -d`).

---

## 6. Difficultés rencontrées

| Problème | Solution |
|----------|----------|
| Healthcheck API échouait (pas de `curl` dans l'image slim) | Utilisation de Python natif pour le check HTTP |
| Nginx ne démarre pas en non-root sur le port 80 | L'image `nginx:alpine` gère cela nativement ; on garde `USER app` pour les fichiers |
| Docker Content Trust complexe sans registre privé | Documentation dans le script, étapes conditionnelles |

---

## 7. Améliorations possibles

- **CI/CD** : GitHub Actions ou GitLab CI pour build/test/push automatiques.
- **Scaling** : `docker compose up -d --scale api=3` + load balancer.
- **Monitoring** : ajouter Prometheus + Grafana pour les métriques.
- **Secrets** : utiliser Docker Secrets ou Vault au lieu de variables en clair.
- **HTTPS** : Traefik ou Caddy en front avec certificats Let's Encrypt.

---

## 8. Structure du dépôt

```
tp_final/
├── .env                  # Variables d'environnement
├── .gitignore
├── docker-compose.yml
├── README.md
├── report.md             # Ce rapport
├── api/
│   ├── .dockerignore
│   ├── Dockerfile        # Multi-étapes, user non-root
│   ├── main.py           # FastAPI /status /items
│   └── requirements.txt
├── db/
│   └── init.sql          # Schéma + données initiales
├── front/
│   ├── .dockerignore
│   ├── Dockerfile        # Multi-étapes, nginx:alpine
│   ├── index.html
│   ├── app.js
│   └── nginx.conf        # Reverse proxy /api
└── scripts/
    ├── build_and_deploy.sh
    └── build_and_deploy.ps1
```

---

**Auteur** : Pierre FAGOT  
**Date** : Décembre 2025  
**Module** : Docker — EPSI SN3
