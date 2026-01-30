import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQ0ODksImV4cCI6MjA4NDM0MDQ4OX0.Uw5xQLK2TSYeEVDzTYW0jwwui_1CMS_pfPpl4h5_bLk";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginFormContainer = document.getElementById("login-form-container");
const booksList = document.getElementById("booksList");
const cartList = document.getElementById("cartList");
const ordersList = document.getElementById("ordersList");
const checkoutBtn = document.getElementById("checkoutBtn");
const searchInput = document.getElementById("search");

let session = null;
let cart = [];
let books = [];
let orders = [];

//authorization stuff
async function initAuth() {
  const { data } = await supabase.auth.getSession();
  session = data.session;

  if (!session) {
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
    booksList.innerHTML = "<p>Please log in to browse books</p>";
    ordersList.innerHTML = "";
    return false;
  }

  loginBtn?.classList.add("hidden");
  logoutBtn?.classList.remove("hidden");
  return true;
}

//books
async function loadBooks() {
  try {
    const token = session.access_token;
    const res = await fetch(`${API_BASE}/books`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) throw new Error(`Failed to load books (${res.status})`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Books response is not an array:", data);
      booksList.innerHTML = "<p>Error loading books</p>";
      return;
    }

    books = data;
    renderBooks(books);

  } catch (err) {
    console.error(err);
    booksList.innerHTML = "<p>Error loading books</p>";
  }
}

function renderBooks(data) {
  booksList.innerHTML = "";
  if (!data.length) booksList.innerHTML = "<p>No books found</p>";
  data.forEach(book => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img src="${SUPABASE_URL}/storage/v1/object/public/${book.image_path}" 
           alt="${book.title}" 
           onerror="this.src='image/book/cover.jpg'">
      <div class="itemnonimage">
        <h1>${book.title}</h1>
        <h2>Author: ${book.author}</h2>
        <h3>Price: $${Number(book.price).toFixed(2)}</h3>
        <h3>Quantity available: ${book.quantity}</h3>
        <button onclick="addToCart('${book.id}')">Add to Cart</button>
      </div>
    `;
    booksList.appendChild(div);
  });
}

//cart stuff
function renderCart() {
  cartList.innerHTML = "";
  if (!cart.length) {
    cartList.innerHTML = "<p>Cart is empty</p>";
    return;
  }
  cart.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="itemnonimage">
        <h1>${item.title}</h1>
        <h3>Quantity: ${item.quantity}</h3>
        <h3>Total: $${(item.price * item.quantity).toFixed(2)}</h3>
        <button onclick="removeFromCart(${idx})">Remove</button>
      </div>
    `;
    cartList.appendChild(div);
  });
}

window.addToCart = function(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  const existing = cart.find(c => c.id === bookId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ ...book, quantity: 1 });
  }
  renderCart();
};

window.removeFromCart = function(idx) {
  cart.splice(idx, 1);
  renderCart();
};

//checkout
checkoutBtn.addEventListener("click", async () => {
  if (!cart.length) return alert("Cart is empty");

  const payload = cart.map(item => ({
    book_id: item.id,
    quantity: item.quantity,
    unit_price: item.price
  }));

  try {
    const token = session.access_token;

    const res = await fetch(`${API_BASE}/checkout`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items: payload })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Checkout failed: ${text}`);
    }

    const data = await res.json();
    alert(`Order placed! Order ID: ${data.order_id}`);

    cart = [];
    renderCart();
    await loadOrders();

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

//customer orders here
async function loadOrders() {
  if (!session) return;

  try {
    const token = session.access_token;

    const res = await fetch(
      `${API_BASE}/orders?customer_id=${session.user.id}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Orders API failed:", res.status, text);
      ordersList.innerHTML = `<p>Error loading orders (${res.status})</p>`;
      return;
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Orders response is not an array:", data);
      ordersList.innerHTML = "<p>Invalid orders response</p>";
      return;
    }

    orders = data;
    renderOrders(orders);

  } catch (err) {
    console.error("Network / fetch error:", err);
    ordersList.innerHTML = "<p>Network error loading orders</p>";
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
        <h1>Order #: ${order.order_number}</h1>
        <h3>Status: ${order.status}</h3>
        <p>Created: ${new Date(order.created_at).toLocaleString()}</p>
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
  window.location.reload();
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

//search
searchInput?.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  );
  renderBooks(filteredBooks);
});

(async function initPage() {
  if (await initAuth()) {
    await loadBooks();
    await loadOrders();
    renderCart();
  }
})();
