const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc2NDQ4OSwiZXhwIjoyMDg0MzQwNDg5fQ.uDvtOGNokH33H8Dly0E-MF3scULNwjsDFFkTlc58jFs";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export let session = null;
export let userRole = "customer";

export async function apiFetch(path, options = {}) {
  if (!session) throw new Error("Not authenticated");

  return fetch(path, {
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

  if (session) {
    loginBtn?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");
    loggedInMsg?.classList.remove("hidden");

    userRole = session.user?.user_metadata?.role || "customer";

    const adminLinks = document.querySelectorAll("#notlogolower a");
    adminLinks.forEach(link => {
      const text = link.textContent.trim().toLowerCase();
      if (["inventory", "sales"].includes(text) && userRole !== "employee") {
        link.style.display = "none";
      }
    });
  } else {
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
    loggedInMsg?.classList.add("hidden");
  }
}

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  window.location.href = "p/login.html";
});

const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);

  session = data.session;
  userRole = session.user?.user_metadata?.role || "customer";
  window.location.href = "../index.html";
});

const signupForm = document.getElementById("signupForm");
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { role: "customer" } }
  });
  if (error) return alert(error.message);

  session = data.session;
  userRole = session.user?.user_metadata?.role || "customer";
  window.location.href = "../index.html";
});

initAuth();
