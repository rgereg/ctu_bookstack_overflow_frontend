import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqdnBscGJ4c3J4Z2RsZGNvc2RmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc2NDQ4OSwiZXhwIjoyMDg0MzQwNDg5fQ.uDvtOGNokH33H8Dly0E-MF3scULNwjsDFFkTlc58jFs";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  await requireAuth();
  await loadTables();
});

async function requireAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "/login.html";
    return;
  }
}

async function apiFetch(path) {
  const { data: { session } } = await supabase.auth.getSession();

  return fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });
}

async function loadTables() {
  const res = await apiFetch("/dashboard");
  const data = await res.json();

  renderTable("Books", data.books);
  renderTable("Orders", data.orders);
  renderTable("Order Items", data.order_items);
}

function renderTable(title, rows) {
  const container = document.getElementById("tables-container");

  const table = document.createElement("table");
  table.border = "1";

  const caption = document.createElement("caption");
  caption.textContent = title;
  table.appendChild(caption);

  if (!rows.length) {
    table.innerHTML += "<tr><td>No data</td></tr>";
    container.appendChild(table);
    return;
  }

  const header = document.createElement("tr");
  Object.keys(rows[0]).forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    header.appendChild(th);
  });
  table.appendChild(header);

  rows.forEach(row => {
    const tr = document.createElement("tr");
    Object.values(row).forEach(val => {
      const td = document.createElement("td");
      td.textContent = val;
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  container.appendChild(table);
}
