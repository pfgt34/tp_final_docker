// État de l'application
let isLoading = false;

// Éléments du DOM
const apiIndicator = document.getElementById('api-indicator');
const apiStatus = document.getElementById('api-status');
const dbIndicator = document.getElementById('db-indicator');
const dbStatus = document.getElementById('db-status');
const itemsCount = document.getElementById('items-count');
const itemsContainer = document.getElementById('items-container');
const refreshBtn = document.getElementById('refresh');

// Récupérer le statut de l'API
async function fetchStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    
    apiIndicator.classList.add('online');
    apiStatus.textContent = data.status === 'OK' ? 'En ligne' : data.status;
    
    return true;
  } catch (error) {
    apiIndicator.classList.remove('online');
    apiStatus.textContent = 'Hors ligne';
    return false;
  }
}

// Récupérer les items
async function fetchItems() {
  if (isLoading) return;
  isLoading = true;
  
  // Afficher le loader
  itemsContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;
  
  try {
    const response = await fetch('/api/items');
    const items = await response.json();
    
    // Mettre à jour le statut DB
    dbIndicator.classList.add('online');
    dbStatus.textContent = 'Connectée';
    
    // Mettre à jour le compteur
    itemsCount.textContent = items.length;
    
    // Afficher les items
    if (items.length === 0) {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <span>📭</span>
          <p>Aucun item trouvé</p>
        </div>
      `;
    } else {
      const itemsHTML = items.map(item => `
        <li class="item">
          <div class="item-id">${item.id}</div>
          <div class="item-content">
            <div class="item-name">${escapeHtml(item.name)}</div>
            <div class="item-description">${escapeHtml(item.description || 'Aucune description')}</div>
          </div>
        </li>
      `).join('');
      
      itemsContainer.innerHTML = `<ul class="items-list">${itemsHTML}</ul>`;
    }
  } catch (error) {
    console.error('Erreur:', error);
    dbIndicator.classList.remove('online');
    dbStatus.textContent = 'Erreur';
    itemsCount.textContent = '—';
    
    itemsContainer.innerHTML = `
      <div class="empty-state">
        <span>⚠️</span>
        <p>Impossible de charger les items</p>
      </div>
    `;
  } finally {
    isLoading = false;
  }
}

// Échapper le HTML pour éviter les XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Rafraîchir toutes les données
async function refresh() {
  refreshBtn.disabled = true;
  refreshBtn.style.opacity = '0.7';
  
  await fetchStatus();
  await fetchItems();
  
  refreshBtn.disabled = false;
  refreshBtn.style.opacity = '1';
}

// Event listeners
refreshBtn.addEventListener('click', refresh);

// Chargement initial
refresh();

// Auto-refresh toutes les 30 secondes
setInterval(refresh, 30000);
