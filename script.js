console.log("script.js loaded"); /* temporary for debugging display  */

const main = document.getElementById('main');
const searchInput = document.getElementById('search');

// Fetch inventory from backend (with optional search)
function fetchInventory(query = '') {
  const url = query
    ? `/api/inventory?search=${encodeURIComponent(query)}`
    : '/api/inventory';

  fetch(url)
    .then(res => res.json())
    .then(data => {
      renderInventory(data);
    });
}

// Render inventory items
function renderInventory(data) {
  main.innerHTML = '';

  if (data.length === 0) {
    main.innerHTML = '<p>No matching books found.</p>';
    return;
  }

  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <h1>${item.title}</h1>
      <h2>by ${item.author}</h2>
      <img src="image/book/${item.isbn}.jpg" />
      <p>ISBN: ${item.isbn}</p>
      <p>${item.description}</p>
      <div class="shareline">
        <h3 class="price">$${item.price.toFixed(2)}</h3>
        <h3 class="quant">Qt. ${item.quantity}</h3>
      </div>
    `;
    main.appendChild(div);
  });
}

// Debounce helper
function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Debounced search handler
const debouncedSearch = debounce(value => {
  fetchInventory(value);
});

// Search input listener
searchInput.addEventListener('input', e => {
  debouncedSearch(e.target.value);
});

// Initial load (show all books)
fetchInventory();
