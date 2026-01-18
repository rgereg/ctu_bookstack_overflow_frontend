console.log("script.js loaded"); /* THIS version is temporary so we can test on github pages, it uses inventory.json file instead of backend */

const main = document.getElementById('main');
const searchInput = document.getElementById('search');

// TEMPORARY ROLE FLAG NOT REAL ADMIN
const userRole = "admin"; // change to "user" to hide form


let inventory = [];

fetch('./inventory.json')
  .then(res => {
    if (!res.ok) throw new Error('Failed to load inventory.json');
    return res.json();
  })
  .then(data => {
    inventory = data;
    renderInventory(inventory);
  })
  .catch(err => console.error(err));

function renderInventory(data) {
  main.innerHTML = '';

  if (!data || data.length === 0) {
    main.innerHTML = '<p>No matching books found.</p>';
    return;
  }

  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <img src="image/book/${item.isbn}.jpg" onerror="this.onerror=null; this.src='image/book/cover.jpg';" />
      <div class="itemnonimage">
      <h1>${item.title}</h1>
      <h2>by ${item.author}</h2>
      <p>ISBN: ${item.isbn}</p>
      <p>${item.description}</p>
      <div class="shareline">
        <h3 class="price">$${item.price.toFixed(2)}</h3>
        <h3 class="quant">Qt. ${item.quantity}</h3>
      </div>
      </div>
    `;
    main.appendChild(div);
  });
}

if (searchInput) {
  searchInput.addEventListener('input', e => {
    const query = e.target.value.toLowerCase();
    const filtered = inventory.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.author.toLowerCase().includes(query) ||
      item.isbn.includes(query)
    );
    renderInventory(filtered);
  });
}

const adminToggle = document.getElementById('adminToggle');
const addForm = document.getElementById('add-form-container');

if (adminToggle && addForm && userRole === "admin") {
  adminToggle.addEventListener('click', () => {
    addForm.classList.toggle('hidden');
  });
} else if (adminToggle) {
  // hide button entirely for non-admins
  adminToggle.style.display = "none";
}

// THIS SECTION IS FOR CURRENT JSON PAGES TESTING UNTIL SWITCH TO DJANGO
const bookForm = document.getElementById('bookForm');

if (bookForm) {
  bookForm.addEventListener('submit', e => {
    e.preventDefault();

    const newBook = {
      title: document.getElementById('title').value,
      author: document.getElementById('author').value,
      isbn: document.getElementById('isbn').value,
      description: document.getElementById('description').value,
      price: parseFloat(document.getElementById('price').value),
      quantity: parseInt(document.getElementById('quantity').value)
    };

    inventory.push(newBook);
    renderInventory(inventory);

    bookForm.reset();
  });
}
/*   THIS SECTION IS FOR WHEN WE SWITCH TO DJANGO
fetch('/api/books/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': csrftoken
  },
  body: JSON.stringify(newBook)
})
.then(res => res.json())
.then(data => {
  inventory.push(data);
  renderInventory(inventory);
});
*/
