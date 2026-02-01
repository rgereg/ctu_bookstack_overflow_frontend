import { initAuth, userRole, apiFetch, supabaseClient } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");

let orderList = [];
let session = null;

async function initPage() {
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;
  //session = await initAuth(); testing to see what breaks

  if (!session) {
    main.innerHTML = "<div id='message'><p>Please log in to view orders.</p></div>";
    return;
  }
  else {
        await loadOrders();
  }
}


async function loadOrders() {
    try {
      const res = await apiFetch(`/orders`);
      orderList = await res.json();
      console.log(orderList);
      renderOrders(orderList);
    } catch (err) {
      console.error(err);
      main.innerHTML = "<div id='message'><p>Error loading orders.</p></div>";
    }
}

function renderOrders(data) {
    main.innerHTML = "";

    if (!data.length) {
        main.innerHTML = "<div id='message'><p>No orders found</p></div>";
        return;
    }

    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "item";

          let itemsHTML = "";
        const items = order.items || [];
        items.forEach(item => {
          const title = item.title || "Unknown";
          const qty = item.quantity ?? 0;
          const price = Number(item.price ?? 0).toFixed(2);
          itemsHTML += `<p>${title} — Quantity: ${qty}, Unit Price: $${price}</p>`;
        });
    
        div.innerHTML = `
          <div class="itemnonimage">
            <h1>Order ID: ${order.id}</h1>
            <h2>Customer ID: ${order.customer_id}</h2>
            <h3>Status: ${order.status}</h3>
            <h4>Created: ${new Date(order.created_at).toLocaleString()}</h4>
            <div>Items: ${itemsHTML || "<p>No items</p>"}</div>
          </div>
        `;

        main.appendChild(div);
    });
}


initPage();


