import { apiFetch, session } from "./loginpage.js";

const booksContainer = document.getElementById("booksContainer");
const searchInput = document.getElementById("search");

async function loadBooks(query = "") {
  if (!session) {
    booksContainer.innerHTML = "<p>Please log in to see books.</p>";
    return;
  }

  try {
    const res = await apiFetch("/books");
    if (!res.ok) throw new Error("Failed to fetch books");
    const books = await res.json();

    const filtered = query
      ? books.filter(b => 
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.author.toLowerCase().includes(query.toLowerCase()) ||
          b.isbn.includes(query)
        )
      : books;

    booksContainer.innerHTML = filtered.length
      ? filtered.map(b => `
          <div class="book-card">
            <p><strong>${b.title}</strong> by ${b.author}</p>
            <p>ISBN: ${b.isbn}</p>
            <p>Price: $${b.price.toFixed(2)}</p>
            <p>Quantity: ${b.quantity}</p>
          </div>
        `).join("")
      : "<p>No books found.</p>";

  } catch (err) {
    console.error(err);
    booksContainer.innerHTML = "<p>Error loading books.</p>";
  }
}

searchInput.addEventListener("input", () => {
  loadBooks(searchInput.value);
});

loadBooks();
