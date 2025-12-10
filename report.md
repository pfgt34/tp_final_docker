# Rapport de projet — TD Docker

## Introduction

Dans le cadre de ce TD, j'ai développé une application web conteneurisée composée de trois services : une API en Python, une base de données PostgreSQL et un frontend statique. L'objectif était de mettre en pratique les concepts vus en cours sur Docker et Docker Compose, tout en respectant les bonnes pratiques de sécurité et d'optimisation.

---

## 1. Présentation de l'architecture

J'ai choisi de séparer l'application en trois conteneurs distincts pour respecter le principe de séparation des responsabilités :

```
         ┌─────────────┐
         │   Frontend  │ ← Port 8080 (accès utilisateur)
         │   (Nginx)   │
         └──────┬──────┘
                │ proxy /api
                ▼
         ┌─────────────┐
         │     API     │ ← Port 8000
         │  (FastAPI)  │
         └──────┬──────┘
                │
                ▼
         ┌─────────────┐
         │  Database   │ ← Port 5432 (interne)
         │ (PostgreSQL)│
         └─────────────┘
```

**Le frontend** est un site statique servi par Nginx. J'ai configuré Nginx en tant que reverse proxy : quand le navigateur fait une requête vers `/api/...`, Nginx la redirige vers le conteneur API. Ça permet d'éviter les problèmes de CORS et de n'exposer qu'un seul point d'entrée.

**L'API** est développée avec FastAPI, un framework Python que je trouve assez simple à prendre en main. Elle expose deux routes :
- `/status` : renvoie juste "OK" pour vérifier que l'API fonctionne
- `/items` : récupère la liste des items stockés en base

**La base de données** utilise PostgreSQL. J'ai mis en place un script d'initialisation qui crée la table et insère quelques données de test au premier démarrage.

---

## 2. Ce que j'ai appris sur les Dockerfiles

### Les builds multi-étapes

Au début, mes images étaient assez volumineuses. J'ai découvert les builds multi-étapes qui permettent de séparer la phase de build de la phase d'exécution. Concrètement, pour l'API :

```dockerfile
# Étape 1 : on installe les dépendances
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# Étape 2 : on copie juste ce dont on a besoin
FROM python:3.11-slim
COPY --from=builder /install /usr/local
COPY . /app
```

Résultat : mon image API fait environ 250 Mo au lieu de plus d'1 Go si j'avais gardé tous les outils de build.

### L'utilisateur non-root

J'ai appris qu'il ne faut jamais faire tourner un conteneur en root. Du coup, j'ai créé un utilisateur dédié :

```dockerfile
RUN groupadd -r app && useradd -r -g app app
USER app
```

C'est une bonne habitude à prendre pour limiter les dégâts en cas de faille de sécurité.

### Le fichier .dockerignore

Comme le `.gitignore`, ça permet d'exclure des fichiers du contexte de build. J'y ai mis `__pycache__`, `.env`, les logs... Ça accélère le build et évite de copier des fichiers sensibles dans l'image.

---

## 3. Configuration avec Docker Compose

Mon fichier `docker-compose.yml` orchestre les trois services. Voici les points importants :

### Les healthchecks

J'ai galéré un moment avec les healthchecks. Au début j'utilisais `curl` mais il n'est pas installé dans les images slim. J'ai fini par utiliser Python directement pour l'API :

```yaml
healthcheck:
  test: ["CMD-SHELL", "python -c \"import http.client; ...\""]
  interval: 5s
  timeout: 5s
  retries: 5
```

Grâce à `depends_on` avec `condition: service_healthy`, Compose attend que la base soit prête avant de lancer l'API, et que l'API soit prête avant de lancer le front.

### Les variables d'environnement

Toute la configuration (host de la BDD, mot de passe, etc.) est externalisée dans des variables d'environnement. J'ai aussi créé un fichier `.env` à la racine pour centraliser les valeurs.

### La persistance des données

Le volume `db_data` permet de conserver les données même si on supprime le conteneur PostgreSQL. C'est important pour ne pas perdre les données à chaque redémarrage.

---

## 4. Sécurité

En plus de l'utilisateur non-root, j'ai ajouté quelques options de sécurité dans Compose :

```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
```

J'ai aussi fait un scan de vulnérabilités avec Docker Scout. Le résultat :
- 0 vulnérabilités critiques
- 3 vulnérabilités hautes (liées à l'image Python de base)
- Quelques moyennes et basses

Pour les corriger, il faudrait mettre à jour l'image de base régulièrement.

Concernant la signature des images, j'ai poussé mes images sur Docker Hub et tenté d'activer Docker Content Trust. Les clés ont été générées mais la signature a échoué à cause d'un bug connu. J'ai quand même documenté la procédure dans le script d'automatisation.

---

## 5. Automatisation

J'ai créé un script `build_and_deploy.sh` (et sa version PowerShell) qui automatise tout le processus :

1. Build des images
2. Validation de la config Compose
3. Scan de sécurité (optionnel)
4. Déploiement de la stack

Pour l'utiliser :
```bash
./scripts/build_and_deploy.sh
```

---

## 6. Difficultés rencontrées

**Le healthcheck de l'API** : comme je l'ai dit, `curl` n'était pas disponible. J'ai passé du temps à chercher une solution avant de penser à utiliser Python qui est forcément présent dans l'image.

**Nginx en read-only** : j'avais mis `read_only: true` sur le conteneur front pour la sécurité, mais Nginx a besoin d'écrire dans `/var/cache/nginx`. J'ai dû retirer cette option pour le front.

**La signature Docker Content Trust** : c'est plus complexe que prévu. Il faut un registre, des clés, et j'ai eu un bug au moment de la signature. J'ai préféré documenter la procédure plutôt que de bloquer dessus.

---

## 7. Pour aller plus loin

Si j'avais plus de temps, j'aurais aimé ajouter :

- **Un pipeline CI/CD** avec GitHub Actions pour automatiser les builds à chaque push
- **Du monitoring** avec Prometheus et Grafana pour visualiser les métriques
- **Du HTTPS** avec Traefik ou un certificat Let's Encrypt
- **Plus de fonctionnalités** sur l'API : ajout/suppression d'items, authentification...

---

## 8. Commandes utiles

```bash
# Lancer la stack
docker compose up -d

# Voir les logs
docker compose logs -f

# Arrêter tout
docker compose down

# Tout supprimer (y compris les données)
docker compose down -v

# Reconstruire les images
docker compose build --no-cache
```

---

## Conclusion

Ce TD m'a permis de bien comprendre comment fonctionne Docker en pratique. J'ai appris à optimiser mes images, à orchestrer plusieurs services avec Compose, et à appliquer des bonnes pratiques de sécurité. Le plus formateur a été de résoudre les problèmes un par un (healthchecks, permissions, etc.) car ça m'a obligé à vraiment comprendre ce qui se passait.

Le projet est disponible sur GitHub : https://github.com/pfgt34/tp_final_docker

---

**Pierre FAGOT**  
EPSI SN3 — Décembre 2025
