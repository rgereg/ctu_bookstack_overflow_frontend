import { initAuth, session, userRole, apiFetch } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");
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
    main.innerHTML = "<p>Error loading books.</p>";
  }
}

function renderInventory(data) {
  main.innerHTML = "";

  if (!data.length) {
    main.innerHTML = "<p>No books found.</p>";
    return;
  }

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img
        src="http://ajvplpbxsrxgdldcosdf.supabase.co/storage/v1/object/public/${item.image_path}"
        alt="${item.title}"
        onerror="this.src='http://ajvplpbxsrxgdldcosdf.supabase.co/storage/v1/object/public/image/book/cover.jpg';"
      />

      <div class="itemnonimage">
        <h1>${item.title}</h1>
        <h2>by ${item.author}</h2>
        <p>ISBN: ${item.isbn}</p>
        <p>${item.description || ""}${item.id}</p>

        <div class="shareline">
          <h3 class="price">$${Number(item.price).toFixed(2)}</h3>
          <h3 class="quant">Qty. ${item.quantity}</h3>
        </div>

        ${
          session && userRole === "customer"
            ? `<button class="order-btn" data-isbn="${item.isbn}">Add to Cart</button>`
            : ""
        }
      </div>
    `;

    main.appendChild(div);
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
