import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjQ0ODksImV4cCI6MjA4NDM0MDQ4OX0.Uw5xQLK2TSYeEVDzTYW0jwwui_1CMS_pfPpl4h5_bLk";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

export const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export let session = null;
export let userRole = "customer";

export async function apiFetch(path, options = {}) {
  if (!session) {
    throw new Error("Not authenticated");
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
      ...(options.headers || {})
    }
  });
}

export async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const loggedInMsg = document.getElementById("you-are-logged-in");
  const loginFormContainer = document.getElementById("login-form-container");

  if (session) {
    userRole = session.user?.user_metadata?.role || "customer";
    console.log(userRole);

    loginBtn?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");
    loginFormContainer?.classList.add("hidden");
    loggedInMsg?.classList.remove("hidden");

    if (userRole !== "employee") {
  document.querySelectorAll(".eonly").forEach(el => {
    el.style.display = "none";
  });
}
  } else {
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
    loggedInMsg?.classList.add("hidden");
    document.querySelectorAll(".eonly").forEach(el => {
    el.style.display = "none";
  });
  }
}

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "https://rgereg.github.io/ctu_bookstack_overflow_frontend/p/login.html";
});

document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert(error.message);
    return;
  }

  session = data.session;
  userRole = session.user?.user_metadata?.role || "customer";

  window.location.href = "../index.html";
});

document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: { role: "customer" }
    }
  });

  if (error) {
    alert(error.message);
    return;
  }

  session = data.session;
  userRole = session.user?.user_metadata?.role || "customer";

  window.location.href = "../index.html";
});

initAuth();
