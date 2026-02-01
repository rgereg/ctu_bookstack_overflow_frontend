import { initAuth, userRole, apiFetch } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");

let orderList = [];
let session = null;

async function initPage() {
  session = await initAuth();

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

        div.innerHTML = `
        <div class="itemnonimage">
            <h1>Order ID: ${item.id}</h1>
            <h2>Customer ID: ${item.customer_id}</h2>
            <h3>Status: ${item.status}</h3>
        </div>
        `;

        main.appendChild(div);
    });
}

initPage();
