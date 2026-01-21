const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQ0ODksImV4cCI6MjA4NDM0MDQ4OX0.Uw5xQLK2TSYeEVDzTYW0jwwui_1CMS_pfPpl4h5_bLk";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com/";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const main = document.getElementById("main");
const searchInput = document.getElementById("search");
const adminToggle = document.getElementById("adminToggle");
const addForm = document.getElementById("add-form-container");
const bookForm = document.getElementById("bookForm");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupRole = document.getElementById("signupRole");

const ordersTableBody = document.querySelector("#ordersTable tbody");

let inventory = [];
let session = null;
let userRole = "user";

async function initAuth() {
  const { data } = await supabase.auth.getSession();
  session = data.session;

  if (session) {
    userRole = session.user.user_metadata?.role || "customer";
    loginBtn.classList.add("hidden");
    signupBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    if (userRole === "employee") adminToggle.classList.remove("hidden");
  }
}

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  session = data.session;
  userRole = session.user.user_metadata?.role || "customer";

  loginBtn.classList.add("hidden");
  signupBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
  loginFormContainer.classList.add("hidden");
  loginForm.reset();

  if (userRole === "employee") adminToggle.classList.remove("hidden");
}

async function signup(email, password, role) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } }
  });
  if (error) throw error;

  alert("Sign up successful! Check email for confirmation.");
  signupFormContainer.classList.add("hidden");
  signupForm.reset();
}

async function logout() {
  await supabase.auth.signOut();
  session = null;
  userRole = "customer";

  loginBtn.classList.remove("hidden");
  signupBtn.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
  adminToggle.classList.add("hidden");
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
  if (!data.length) main.innerHTML = "<p>No books found.</p>";

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
    renderOrders(orders);
  } catch (err) {
    console.error("Failed to load orders", err);
  }
}

function renderOrders(orders) {
  ordersTableBody.innerHTML = "";

  orders.forEach(order => {
    if (userRole === "customer" && order.customer_email !== session.user.email) return;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.book_title}</td>
      <td>${order.quantity}</td>
      <td>${order.status}</td>
      <td>${order.customer_email || "-"}</td>
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
  const quantity = prompt("Enter quantity:");
  if (!quantity) return;

  try {
    await apiFetch("/orders", {
      method: "POST",
      body: JSON.stringify({ isbn, quantity: parseInt(quantity) })
    });
    alert("Order placed!");
    await loadOrders();
  } catch (err) {
    alert("Failed to place order: " + err.message);
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
    alert("Failed to update order: " + err.message);
  }
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

adminToggle?.addEventListener("click", () => addForm.classList.toggle("hidden"));

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
    const res = await apiFetch("/books", { method: "POST", body: JSON.stringify(newBook) });
    const saved = await res.json();
    inventory.push(saved);
    renderInventory(inventory);
    bookForm.reset();
  } catch (err) {
    alert("Only employees can add books");
  }
});

loginBtn.addEventListener("click", () => {
  loginFormContainer.classList.toggle("hidden");
  signupFormContainer.classList.add("hidden");
});

signupBtn.addEventListener("click", () => {
  signupFormContainer.classList.toggle("hidden");
  loginFormContainer.classList.add("hidden");
});

logoutBtn.addEventListener("click", logout);

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await login(loginEmail.value, loginPassword.value);
    await loadInventory();
    await loadOrders();
  } catch (err) {
    alert(err.message);
  }
});

signupForm.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await signup(signupEmail.value, signupPassword.value, signupRole.value);
  } catch (err) {
    alert(err.message);
  }
});

(async () => {
  await initAuth();
  if (session) {
    await loadInventory();
    await loadOrders();
  }
})();
