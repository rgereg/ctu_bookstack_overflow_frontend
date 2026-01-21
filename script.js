console.log("script.js loaded");

const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQ0ODksImV4cCI6MjA4NDM0MDQ4OX0.Uw5xQLK2TSYeEVDzTYW0jwwui_1CMS_pfPpl4h5_bLk";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com/"; // FastAPI backend

const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const main = document.getElementById("main");
const searchInput = document.getElementById("search");
const adminToggle = document.getElementById("adminToggle");
const addForm = document.getElementById("add-form-container");
const bookForm = document.getElementById("bookForm");

let inventory = [];
let session = null;
let userRole = "user";

async function initAuth() {
  const { data } = await supabase.auth.getSession();
  session = data.session;

  if (!session) {
    console.warn("Not logged in");
    return;
  }

  userRole = session.user.user_metadata?.role || "user";

  if (userRole === "admin") {
    adminToggle.classList.remove("hidden");
  }
}

async function apiFetch(path, options = {}) {
  if (!session) throw new Error("Not authenticated");

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      ...(options.headers || {})
    }
  });
}

async function loadInventory() {
  try {
    const res = await apiFetch("/books");
    inventory = await res.json();
    renderInventory(inventory);
  } catch (err) {
    console.error("Failed to load inventory", err);
  }
}

function renderInventory(data) {
  main.innerHTML = "";

  if (!data.length) {
    main.innerHTML = "<p>No matching books found.</p>";
    return;
  }

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img src="image/book/${item.isbn}.jpg"
           onerror="this.src='image/book/cover.jpg';" />
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

searchInput?.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = inventory.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.author.toLowerCase().includes(q) ||
    item.isbn.includes(q)
  );
  renderInventory(filtered);
});

adminToggle?.addEventListener("click", () => {
  addForm.classList.toggle("hidden");
});

bookForm?.addEventListener("submit", async e => {
  e.preventDefault();

  const newBook = {
    title: title.value,
    author: author.value,
    isbn: isbn.value,
    description: description.value,
    price: parseFloat(price.value),
    quantity: parseInt(quantity.value)
  };

  try {
    const res = await apiFetch("/books", {
      method: "POST",
      body: JSON.stringify(newBook)
    });

    const saved = await res.json();
    inventory.push(saved);
    renderInventory(inventory);
    bookForm.reset();
  } catch (err) {
    alert("Only admins can add books");
  }
});

(async () => {
  await initAuth();
  await loadInventory();
})();
