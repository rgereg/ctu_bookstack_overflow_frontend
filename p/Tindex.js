import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQ0ODksImV4cCI6MjA4NDM0MDQ4OX0.Uw5xQLK2TSYeEVDzTYW0jwwui_1CMS_pfPpl4h5_bLk";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginFormContainer = document.getElementById("login-form-container");
const main = document.getElementById("main");
const searchInput = document.getElementById("search");

let userRole = "customer";
let session = null;
let inventory = [];

//authorization stuff
async function initAuth() {
  const { data } = await supabase.auth.getSession();
  session = data.session;
  userRole = session?.user?.user_metadata?.role || "customer";

  if (session) {
    loginBtn?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");
  } else {
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
  }
}

//inventory stuff
async function loadInventory() {
  try {
    const res = await fetch("https://ctu-bookstack-overflow-backend.onrender.com/books");
    inventory = await res.json();
    renderInventory(inventory);
  } catch (err) {
    console.error(err);
    main.innerHTML = "<p>Error loading inventory</p>";
  }
}

function renderInventory(data) {
  main.innerHTML = "";
  if (!data.length) main.innerHTML = "<p>No books</p>";
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
        <h3>ISBN: ${book.isbn || "N/A"}</h3>
        <p>${book.description || "No description available."}</p>
        <h3>Price: $${Number(book.price).toFixed(2)}</h3>
        <h3>Quantity: ${book.quantity ?? 0}</h3>
      </div>
    `;
    main.appendChild(div);
  });
}

//search
searchInput?.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();
  const filtered = inventory.filter(book =>
    book.title.toLowerCase().includes(q) ||
    book.author.toLowerCase().includes(q) ||
    book.isbn.includes(q)
  );
  renderInventory(filtered);
});

//login
loginBtn?.addEventListener("click", () => {
  loginFormContainer.classList.toggle("hidden");
});

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

(async function initPage() {
  await initAuth();
  await loadInventory();
})();
