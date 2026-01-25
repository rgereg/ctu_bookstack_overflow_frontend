import { initAuth, session, userRole, apiFetch } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");
const booksContainer = document.getElementById("booksContainer");
const searchInput = document.getElementById("search");

let inventory = [];

async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    if (!res.ok) throw new Error("Failed to fetch books");

    inventory = await res.json();
    renderInventory(inventory);
  } catch (err) {
    console.error(err);
    booksContainer.innerHTML = "<p>Error loading books.</p>";
  }
}

function renderInventory(data) {
  booksContainer.innerHTML = "";

  if (!data.length) {
    booksContainer.innerHTML = "<p>No books found.</p>";
    return;
  }

  data.forEach(book => {
    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <img
        src="REDACTED/storage/v1/object/public/${book.image_path}"
        alt="${book.title}"
        onerror="this.src='REDACTED/storage/v1/object/public/image/book/cover.jpg';"
      />

      <div class="itemnonimage">
        <h1>${book.title}</h1>
        <h2>by ${book.author}</h2>
        <p>ISBN: ${book.isbn}</p>
        <p>${book.description || ""}</p>

        <div class="shareline">
          <h3 class="price">$${Number(book.price).toFixed(2)}</h3>
          <h3 class="quant">Qty. ${book.quantity}</h3>
        </div>

        ${
          session && userRole === "customer"
            ? `<button class="order-btn" data-isbn="${book.isbn}">Order</button>`
            : ""
        }
      </div>
    `;

    booksContainer.appendChild(div);
  });

  wireOrderButtons();
}

function wireOrderButtons() {
  document.querySelectorAll(".order-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const isbn = btn.dataset.isbn;
      await placeOrder(isbn);
    });
  });
}

async function placeOrder(isbn) {
  if (!session) {
    alert("Login required");
    return;
  }

  const qty = Number(prompt("Enter quantity:"));
  if (!Number.isInteger(qty) || qty <= 0) {
    alert("Invalid quantity");
    return;
  }

  try {
    const res = await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ isbn, quantity: qty })
    });

    if (!res.ok) throw new Error("Order failed");

    alert("Order placed!");
  } catch (err) {
    console.error(err);
    alert("Failed to place order.");
  }
}

searchInput?.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();

  const filtered = inventory.filter(book =>
    book.title.toLowerCase().includes(q) ||
    book.author.toLowerCase().includes(q) ||
    book.isbn.includes(q)
  );

  renderInventory(filtered);
});

(async function initPage() {
  await initAuth();
  await loadInventory();
})();
