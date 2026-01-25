import { apiFetch, session, userRole, initAuth } from "./loginpage.js";

const main = document.getElementById("main");
const searchInput = document.getElementById("search");

let inventory = [];

async function loadBooks() {
  try {
    if (!session) {
      console.warn("Not logged in, cannot fetch books.");
      main.innerHTML = "<p>Please log in to see books.</p>";
      return;
    }

    const res = await apiFetch("/books");
    if (!res.ok) throw new Error("Failed to fetch books");

    const data = await res.json();
    inventory = data;
    displayBooks(data);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<p>Error loading books: ${err.message}</p>`;
  }
}

function displayBooks(books) {
  main.innerHTML = "";

  books.forEach(book => {
    const div = document.createElement("div");
    div.classList.add("book-item");
    div.innerHTML = `
      <h3>${book.title}</h3>
      <p>Author: ${book.author}</p>
      <p>ISBN: ${book.isbn}</p>
      <p>Price: $${book.price}</p>
      <p>Quantity: ${book.quantity}</p>
    `;
    main.appendChild(div);
  });
}

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const filtered = inventory.filter(
    b =>
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.isbn.toLowerCase().includes(query)
  );
  displayBooks(filtered);
});

(async () => {
  await initAuth();
  loadBooks();
})();
