const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQ0ODksImV4cCI6MjA4NDM0MDQ4OX0.Uw5xQLK2TSYeEVDzTYW0jwwui_1CMS_pfPpl4h5_bLk";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com/";

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
  }

  // Inventory should load regardless of orders
  await loadInventory();
  if (session) await loadOrders();
}

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;

  session = data.session;
  userRole = session.user.user_metadata?.role || "customer";

  loginBtn.classList.add("hidden");
  signupBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
  loginFormContainer.classList.add("hidden");

  if (userRole === "employee") adminToggle.classList.remove("hidden");

  await loadInventory();
  await loadOrders();
}

async function signup(email, password) {
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;

  alert("Sign up successful! Please confirm your email.");
  signupFormContainer.classList.add("hidden");
}

async function logout() {
  await supabaseClient.auth.signOut();
  session = null;
  userRole = "customer";

  loginBtn.classList.remove("hidden");
  signupBtn.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
  adminToggle.classList.add("hidden");

  inventory = [];
  main.innerHTML = "";
  ordersTableBody.innerHTML = "";
}

async function apiFetch(path, options = {}) {
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    let err;
    try {
      err = await res.json();
    } catch {
      throw new Error("API error");
    }
    throw new Error(err.detail || "API request failed");
  }

  return res;
}

async function loadInventory() {
  try {
    const res = session
      ? await apiFetch("/books")
      : await fetch(`${API_BASE}/books`);

    const data = await res.json();
    inventory = Array.isArray(data) ? data : [];
    renderInventory(inventory);
  } catch (err) {
    console.error("Failed to load inventory:", err.message);
    inventory = [];
    renderInventory([]);
  }
}

function renderInventory(data) {
  main.innerHTML = "";

  if (!Array.isArray(data) || !data.length) {
    main.innerHTML = "<p>No books found.</p>";
    return;
  }

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img src="image/book/${item.isbn}.jpg" onerror="this.src='image/book/cover.jpg';" />
      <div class="itemnonimage">
        <h1>${item.title}</h1>
        <h2>by ${item.author}</h2>
        <p>ISBN: ${item.isbn}</p>
        <p>${item.description}</p>
        <div class="shareline">
          <h3 class="price">$${item.price.toFixed(2)}</h3>
          <h3 class="quant">Qt. ${item.quantity}</h3>
        </div>
        ${userRole === "customer" ? `<button onclick="placeOrder('${item.isbn}')">Order</button>` : ""}
      </div>
    `;
    main.appendChild(div);
  });
}

async function loadOrders() {
  try {
    const res = await apiFetch("/orders");
    const orders = await res.json();

    if (!Array.isArray(orders)) {
      console.error("Orders response not array:", orders);
      renderOrders([]);
      return;
    }

    renderOrders(orders);
  } catch (err) {
    console.error("Failed to load orders:", err.message);
    renderOrders([]);
  }
}

function renderOrders(orders) {
  ordersTableBody.innerHTML = "";
  if (!Array.isArray(orders)) return;

  orders.forEach(order => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.book_title}</td>
      <td>${order.quantity}</td>
      <td>${order.status}</td>
      <td>${order.customer_email || "-"}</td>
      <td>
        ${userRole === "employee" ? `
          <select onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Shipped</option>
            <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
          </select>
        ` : ""}
      </td>
    `;
    ordersTableBody.appendChild(tr);
  });
}

async function placeOrder(isbn) {
  const quantity = prompt("Enter quantity:");
  if (!quantity) return;

  try {
    await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ isbn, quantity: parseInt(quantity) })
    });
    alert("Order placed!");
    await loadOrders();
    await loadInventory();
  } catch (err) {
    alert(err.message);
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    await apiFetch(`/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    await loadOrders();
  } catch (err) {
    alert(err.message);
  }
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

loginBtn.onclick = () => {
  loginFormContainer.classList.toggle("hidden");
  signupFormContainer.classList.add("hidden");
};

signupBtn.onclick = () => {
  signupFormContainer.classList.toggle("hidden");
  loginFormContainer.classList.add("hidden");
};

logoutBtn.onclick = logout;
adminToggle.onclick = () => addFormContainer.classList.toggle("hidden");

loginForm.onsubmit = async e => {
  e.preventDefault();
  await login(loginEmail.value, loginPassword.value);
};

signupForm.onsubmit = async e => {
  e.preventDefault();
  await signup(signupEmail.value, signupPassword.value);
};

document.addEventListener("DOMContentLoaded", initAuth);
