import { initAuth, userRole, apiFetch } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");

let currentOrder = [];
let session = null;


// Going to be messing with this more, using old cart loading function that was in the HTML for the page
async function loadCart() {
  if (!session || userRole !== "customer") {
    main.innerHTML = "<div id='message'><p>Please log in as a customer to view your cart.</p></div>";
    return;
  }

  try {
    const res = await apiFetch(`/orders`);
    const orders = await res.json();

    const cartOrders = orders.filter(o => o.customer_id === session.user.id && o.status === "pending");

    if (cartOrders.length === 0) {
      main.innerHTML = "<div id='message'><p>Your cart is empty.</p></div>";
      return;
    }

    let html = `
        <table>
        <thead>
            <tr>
            <th>Book</th>
            <th>Quantity</th>
            <th>Status</th>
            </tr>
        </thead>
        <tbody>
    `;

    cartOrders.forEach(order => {
        html += `
        <tr>
            <td>${order.book_title}</td>
            <td>${order.quantity}</td>
        </tr>
        `;
    });

    html += "</tbody></table>";
    main.innerHTML = html;

    } catch (err) {
    console.error(err);
    main.innerHTML = "<div id='message'><p>Error loading cart.</p></div>";
    }
}

loadCart();