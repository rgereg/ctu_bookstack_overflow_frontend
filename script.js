const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQ0ODksImV4cCI6MjA4NDM0MDQ4OX0.Uw5xQLK2TSYeEVDzTYW0jwwui_1CMS_pfPpl4h5_bLk";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const main = document.getElementById("main");
const searchInput = document.getElementById("search");
const adminToggle = document.getElementById("adminToggle");
const addFormContainer = document.getElementById("add-form-container");
const bookForm = document.getElementById("bookForm");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const ordersTableBody = document.querySelector("#ordersTable tbody");

let inventory = [];
let session = null;
let userRole = "customer";

async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;

  if (session) {
    userRole = session.user.user_metadata?.role || "customer";
    loginBtn.classList.add("hidden");
    signupBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    if (userRole === "employee") adminToggle.classList.remove("hidden");
    await loadOrders();
  }

  await loadInventory();
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
  const res = await fetch(`${API_BASE}/books`);
  inventory = await res.json();
  renderInventory(inventory);
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
      <img src="https://ajvplpbxsrxgdldcosdf.supabase.co/storage/v1/object/public/image/book/${item.isbn}.jpg" onerror="this.src='https://ajvplpbxsrxgdldcosdf.supabase.co/storage/v1/object/public/image/book/cover.jpg';" />
      <div class="itemnonimage">
        <h1>${item.title}</h1>
        <h2>by ${item.author}</h2>
        <p>ISBN: ${item.isbn}</p>
        <p>${item.description}</p>
        <div class="shareline">
          <h3 class="price">$${item.price.toFixed(2)}</h3>
          <h3 class="quant">Qt. ${item.quantity}</h3>
        </div>
        ${session && userRole === "customer" ? `<button onclick="placeOrder('${item.isbn}')">Order</button>` : ""}
      </div>
    `;
    main.appendChild(div);
  });
}

async function loadOrders() {
  const res = await apiFetch("/orders");
  const orders = await res.json();
  renderOrders(orders);
}

function renderOrders(orders) {
  ordersTableBody.innerHTML = "";
  orders.forEach(order => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.book_title}</td>
      <td>${order.quantity}</td>
      <td>${order.status}</td>
      <td>${userRole === "employee" ? order.customer_id : "-"}</td>
      <td>
        ${userRole === "employee" ? `
          <select onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="pending" ${order.status==="pending"?"selected":""}>Pending</option>
            <option value="shipped" ${order.status==="shipped"?"selected":""}>Shipped</option>
            <option value="delivered" ${order.status==="delivered"?"selected":""}>Delivered</option>
          </select>
        ` : ""}
      </td>
    `;
    ordersTableBody.appendChild(tr);
  });
}

async function placeOrder(isbn) {
  if (!session) return alert("Login required");

  const qty = Number(prompt("Enter quantity:"));
  if (!Number.isInteger(qty) || qty <= 0) {
    alert("Invalid quantity");
    return;
  }

  await apiFetch("/orders", {
    method: "POST",
    body: JSON.stringify({ isbn, quantity: qty })
  });

  alert("Order placed!");
  await loadOrders();
}

searchInput.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = inventory.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.author.toLowerCase().includes(q) ||
    item.isbn.includes(q)
  );
  renderInventory(filtered);
});

initAuth();
