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
const youareloggedin = document.getElementById("you-are-logged-in");
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
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    loginFormContainer.classList.add("hidden");
    youareloggedin.classList.remove("hidden");
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

document.getElementById("sulink").addEventListener("click", function (e) {
    e.preventDefault(); // stop link from jumping
    document.getElementById("login-form-container").classList.add("hidden");
    document.getElementById("signup-form-container").classList.remove("hidden");
  });
document.getElementById("lilink").addEventListener("click", function (e) {
      e.preventDefault(); // stop link from jumping
      document.getElementById("login-form-container").classList.remove("hidden");
      document.getElementById("signup-form-container").classList.add("hidden");
    });

initAuth();
