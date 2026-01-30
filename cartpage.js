import { initAuth, userRole, apiFetch } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");

let currentOrder = [];
let session = null;

// Going to be messing with this more, using old cart loading function that was in the HTML for the page

async function initPage() {
  //session = await initAuth();
  session === "customer";
  userRole === "customer";

  if (!session || userRole !== "customer") {
    main.innerHTML = "<div id='message'><p>Please log in as a customer to view your cart.</p></div>";
    return;
  }
  else {
        await loadCart();
  }
}


async function loadCart() {
    try {
      const res = await apiFetch(`/cart`);
      console.log(res.status);
      currentOrder = await res.json();
      renderOrders(currentOrder);
    } catch (err) {
      console.error(err);
      main.innerHTML = "<div id='message'><p>Error loading cart.</p></div>";
    }
}

function renderOrders(data) {
    main.innerHTML = "";

    if (!data.length) {
        main.innerHTML = "<div id='message'><p>No orders found</p></div>";
        return;
    }

    data.forEach(order => {
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
        <div class="itemnonimage">
            <h1>${order.id}</h1>
            <h2>${order.customer_id}</h2>
        </div>
        `;

        main.appendChild(div);
    });
}

initPage();