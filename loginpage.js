import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc2NDQ4OSwiZXhwIjoyMDg0MzQwNDg5fQ.uDvtOGNokH33H8Dly0E-MF3scULNwjsDFFkTlc58jFs";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");
const youareloggedin = document.getElementById("you-are-logged-in");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

let session = null;

function updateUI() {
  if (session) {
    loginBtn?.classList.add("hidden");
    signupBtn?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");

    loginFormContainer?.classList.add("hidden");
    signupFormContainer?.classList.add("hidden");
    youareloggedin?.classList.remove("hidden");
  } else {
    loginBtn?.classList.remove("hidden");
    signupBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");

    youareloggedin?.classList.add("hidden");
  }
}

async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;
  updateUI();
}

supabaseClient.auth.onAuthStateChange((_event, newSession) => {
  session = newSession;
  updateUI();
});

initAuth();

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
  }
});

signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = signupForm.email.value;
  const password = signupForm.password.value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Check your email to confirm signup");
  }
});

logoutBtn?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

async function apiFetch(path, options = {}) {
  if (!session) throw new Error("Not authenticated");

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
}

document.getElementById("sulink")?.addEventListener("click", (e) => {
  e.preventDefault();
  loginFormContainer.classList.add("hidden");
  signupFormContainer.classList.remove("hidden");
});

document.getElementById("lilink")?.addEventListener("click", (e) => {
  e.preventDefault();
  signupFormContainer.classList.add("hidden");
  loginFormContainer.classList.remove("hidden");
});

window.loadOrders = async () => {
  const res = await apiFetch("/orders");
  console.log(await res.json());
};
