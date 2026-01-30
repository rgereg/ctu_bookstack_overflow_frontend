import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQ0ODksImV4cCI6MjA4NDM0MDQ4OX0.Uw5xQLK2TSYeEVDzTYW0jwwui_1CMS_pfPpl4h5_bLk";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginFormContainer = document.getElementById("login-form-container");
const inventoryList = document.getElementById("inventoryList");
const ordersList = document.getElementById("ordersList");
const searchInput = document.getElementById("search");

let session = null;
let userRole = "customer";
let inventory = [];
let orders = [];

//authorization stuff
async function initAuth() {
  const { data } = await supabase.auth.getSession();
  session = data.session;
  userRole = session?.user?.user_metadata?.role || "customer";

  if (!session || userRole !== "employee") {
    inventoryList.innerHTML = "<p>Please log in as an employee to view this page.</p>";
    ordersList.innerHTML = "";
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
    return false;
  }

  loginBtn?.classList.add("hidden");
  logoutBtn?.classList.remove("hidden");
  return true;
}

//inventory
async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    inventory = await res.json();
    renderInventory(inventory);
  } catch (err) {
    console.error(err);
    inventoryList.innerHTML = "<p>Error loading inventory</p>";
  }
}

function renderInventory(data) {
  inventoryList.innerHTML = "";
  if (!data.length) inventoryList.innerHTML = "<p>No books found</p>";
  data.forEach(book => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img src="${SUPABASE_URL}/storage/v1/object/public/${book.image_path}" 
           alt="${book.title}" 
           onerror="this.src='image/book/cover.jpg'">
      <div class="itemnonimage">
        <h1>${book.title}</h1>
        <h2>ISBN: ${book.isbn}</h2>
        <h3>Price: $${Number(book.price).toFixed(2)}</h3>
        <h3>Quantity: ${book.quantity}</h3>
        <button onclick="updatePrice('${book.isbn}')">Update Price</button>
        <button onclick="updateQuantity('${book.isbn}')">Update Quantity</button>
      </div>
    `;
    inventoryList.appendChild(div);
  });
}

//update price/quantity
window.updatePrice = async function(isbn) {
  const input = prompt("Enter new price:");
  const price = parseFloat(input);
  if (isNaN(price) || price <= 0) return alert("Price must be greater than 0");

  try {
    const res = await fetch(`${API_BASE}/update_price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isbn, price })
    });
    if (!res.ok) throw new Error("Failed");
    alert("Price updated!");
    await loadInventory();
  } catch (err) { console.error(err); alert("Failed"); }
};

window.updateQuantity = async function(isbn) {
  const qty = parseInt(prompt("Enter new quantity:"), 10);
  if (!Number.isInteger(qty) || qty < 0) return alert("Quantity cannot be negative");

  try {
    const res = await fetch(`${API_BASE}/update_quantity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isbn, quantity: qty })
    });
    if (!res.ok) throw new Error("Failed to update quantity");
    alert("Quantity updated!");
    await loadInventory();
  } catch (err) { console.error(err); alert("Update failed"); }
};

//orders stuff
async function loadOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    orders = await res.json();
    renderOrders(orders);
  } catch (err) {
    console.error(err);
    ordersList.innerHTML = "<p>Error loading orders</p>";
  }
}

function renderOrders(data) {
  ordersList.innerHTML = "";
  if (!data.length) ordersList.innerHTML = "<p>No orders</p>";

  data.forEach(order => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="itemnonimage">
        <h1>Order ID: ${order.id}</h1>
        <h2>Customer ID: ${order.customer_id}</h2>
        <h3>Status: ${order.status}</h3>
      </div>
    `;
    ordersList.appendChild(div);
  });
}

//login
loginBtn?.addEventListener("click", () => loginFormContainer.classList.toggle("hidden"));
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  session = data.session;
  userRole = session.user?.user_metadata?.role || "customer";
  window.location.reload();
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

//search
searchInput?.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filteredInventory = inventory.filter(b =>
    b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q)
  );
  const filteredOrders = orders.filter(o =>
    o.id.includes(q) || o.customer_id.includes(q)
  );
  renderInventory(filteredInventory);
  renderOrders(filteredOrders);
});

(async function initPage() {
  if (await initAuth()) {
    await loadInventory();
    await loadOrders();
  }
})();
