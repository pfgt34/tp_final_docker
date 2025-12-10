# TD — Application conteneurisée

Ce dépôt contient une stack minimale : API (FastAPI), base PostgreSQL et front statique servi par Nginx.

Commandes rapides :

- Construire et démarrer en local :
```
docker compose build
docker compose up -d
```

- Vérifier les logs :
```
docker compose ps
docker compose logs -f api
```

- Stopper et nettoyer :
```
docker compose down -v
```

Voir `report.md` pour le rapport détaillé et les choix techniques.
