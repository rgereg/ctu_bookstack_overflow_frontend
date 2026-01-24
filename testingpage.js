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

async function searchBooks() {
  const query = document.getElementById("searchInput").value;
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
  );
  const data = await res.json();

  const resultsDiv = document.getElementById("main");
  resultsDiv.innerHTML = "";

  data.items?.forEach(item => {
    const info = item.volumeInfo;

    const isbn =
      info.industryIdentifiers?.find(i => i.type.includes("ISBN"))?.identifier || "";

    const book = {
      title: info.title || "",
      author: info.authors?.join(", ") || "",
      isbn: isbn,
      image_path: info.imageLinks?.thumbnail
        ?.replace("http://", "https://") || ""
    };

    resultsDiv.innerHTML += `
      <div>
        <img src="${book.image_path}" />
        <p>${book.title} – ${book.author}</p>
        <input type="number" placeholder="Quantity" id="qty-${isbn}">
        <input type="number" placeholder="Price" id="price-${isbn}">
        <button onclick='addBook(${JSON.stringify(book)})'>Add</button>
      </div>
    `;
  });
}
    
    async function addBook(book) {
      const quantity = document.getElementById(`qty-${book.isbn}`).value;
      const price = document.getElementById(`price-${book.isbn}`).value;
    
      const res = await fetch("https://ctu-bookstack-overflow-backend.onrender.com/add-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...book,
          quantity: Number(quantity),
          price: Number(price)
        })
      });
    
      if (res.ok) alert("Book added!");
      else alert("Error adding book");
    }

initAuth();
