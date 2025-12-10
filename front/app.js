// Récupérer le statut de l'API
async function fetchStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    
    document.getElementById('api-indicator').classList.add('ok');
    document.getElementById('api-status').textContent = 'OK';
    return true;
  } catch (error) {
    document.getElementById('api-indicator').classList.remove('ok');
    document.getElementById('api-status').textContent = 'Erreur';
    return false;
  }
}

// Récupérer les items depuis l'API
async function fetchItems() {
  document.getElementById('items-container').innerHTML = '<div class="loading">Chargement...</div>';
  
  try {
    const response = await fetch('/api/items');
    const items = await response.json();
    
    // Mettre à jour le statut DB
    document.getElementById('db-indicator').classList.add('ok');
    document.getElementById('db-status').textContent = 'OK';
    
    // Mettre à jour le compteur
    document.getElementById('items-count').textContent = items.length;
    
    // Afficher les items
    if (items.length === 0) {
      document.getElementById('items-container').innerHTML = '<div class="empty">Aucun item trouvé</div>';
    } else {
      let html = '<ul class="items-list">';
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        html += '<li class="item">';
        html += '<span class="item-id">' + item.id + '</span>';
        html += '<span class="item-name">' + item.name + '</span>';
        html += '<div class="item-desc">' + (item.description || 'Pas de description') + '</div>';
        html += '</li>';
      }
      html += '</ul>';
      document.getElementById('items-container').innerHTML = html;
    }
  } catch (error) {
    console.error('Erreur:', error);
    document.getElementById('db-indicator').classList.remove('ok');
    document.getElementById('db-status').textContent = 'Erreur';
    document.getElementById('items-container').innerHTML = '<div class="empty">Erreur de chargement</div>';
  }
}

// Rafraîchir les données
function refresh() {
  fetchStatus();
  fetchItems();
}

// Bouton actualiser
document.getElementById('refresh').addEventListener('click', function() {
  refresh();
});

// Chargement initial
refresh();
