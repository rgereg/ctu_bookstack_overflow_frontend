console.log("script.js loaded"); /* THIS version is temporary so we can test on github pages, it uses inventory.json file instead of backend */

const main = document.getElementById('main');
const searchInput = document.getElementById('search');

// TEMPORARY ROLE FLAG NOT REAL ADMIN
const userRole = "admin"; // change to "user" to hide form


let inventory = [];

// remove after testing ---v
const testInventory = [
  {
    "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
    "author": "Robert C. Martin",
    "isbn": "978-0132350884",
    "description": "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn't have to be that way.",
    "price": 59.99,
    "quantity": 12
  },
  {
    "title": "The Pragmatic Programmer: From Journeyman to Master",
    "author": "Andrew Hunt and David Thomas",
    "isbn": "978-0201616224",
    "description": "Straight from the programming trenches, The Pragmatic Programmer cuts through the increasing specialization and technicalities of modern software development to examine the core process--taking a requirement and producing working, maintainable code that delights its users. It covers topics ranging from personal responsibility and career development to architectural techniques for keeping your code flexible and easy to adapt and reuse. ",
    "price": 64.98,
    "quantity": 8
  },
  {
    "title": "Python Crash Course: A Hands-on, Project-based Introduction to Programming",
    "author": "Eric Matthes",
    "isbn": "978-1718502703",
    "description": "Python Crash Course is the world’s best-selling guide to the Python programming language. This fast-paced, thorough introduction will have you writing programs, solving problems, and developing functioning applications in no time.",
    "price": 49.99,
    "quantity": 2
  },
  {
    "title": "You Don't Know JS: this & Object Prototypes",
    "author": "Kyle Simpson",
    "isbn": "978-1491904152",
    "description": "(From Test Inventory) No matter how much experience you have with JavaScript, odds are you don’t fully understand the language. This concise, in-depth guide takes you inside JavaScript’s this structure and object prototypes.",
    "price": 21.99,
    "quantity": 15
  }
]
// remove after testing ---^

fetch('./inventory.json')
  .then(res => {
    if (!res.ok) throw new Error('Failed to load inventory.json');
    return res.json();
  })
  .then(data => {
    inventory = data;
    renderInventory(inventory);
  })
  //.catch(err => console.error(err));
  .catch(err => {
    console.warn("Fetch failed, using local test data:", err);
    inventory = testInventory;
    renderInventory(inventory);
  });

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
