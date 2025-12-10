async function fetchStatus() {
  try {
    const r = await fetch('/api/status');
    const j = await r.json();
    document.getElementById('status').textContent = 'API: ' + j.status;
  } catch (e) {
    document.getElementById('status').textContent = 'API: unavailable';
  }
}

async function fetchItems() {
  try {
    const r = await fetch('/api/items');
    const items = await r.json();
    const ul = document.getElementById('items');
    ul.innerHTML = '';
    items.forEach(it => {
      const li = document.createElement('li');
      li.textContent = `${it.id} - ${it.name} : ${it.description || ''}`;
      ul.appendChild(li);
    });
  } catch (e) {
    console.error(e);
  }
}

document.getElementById('refresh').addEventListener('click', () => {
  fetchStatus();
  fetchItems();
});

fetchStatus();
fetchItems();
