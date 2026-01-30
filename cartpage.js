import { initAuth, userRole, apiFetch } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");

let currentOrder = [];
let session = null;

// Going to be messing with this more, using old cart loading function that was in the HTML for the page

async function initPage() {
  session = await initAuth();

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
      currentOrder = await res.json();
      console.log(currentOrder);
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

    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
        <div class="itemnonimage">
            <h1>Book ID: ${item.books.title}</h1>
            <h2>Quantity: ${item.quantity}</h2>
            <h3>Placeholder: ${item.unit_price}</h3>
        </div>
        `;

        main.appendChild(div);
    });
}

initPage();