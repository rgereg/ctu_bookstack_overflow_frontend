import { initAuth, userRole, apiFetch, refreshAuth, supabaseClient } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");
const refreshAuthBtn = document.getElementById("refreshAuthBtn");

let currentOrder = [];
let session = null;

// Going to be messing with this more, using old cart loading function that was in the HTML for the page

async function initPage() {
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;
  //session = await initAuth(); testing to see what breaks

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
      renderCart(currentOrder);
    } catch (err) {
      console.error(err);
      main.innerHTML = "<div id='message'><p>Error loading cart.</p></div>";
    }
}

function renderCart(data) {
  main.innerHTML = "";

  if (!data.length) {
    main.innerHTML = "<div id='message'><p>Your cart is empty</p></div>";
    document.getElementById("totalCost").textContent = "";
    return;
  }

  let totalCost = 0;

  data.forEach(item => {
    const price = Number(item.unit_price || 0);
    const quantity = Number(item.quantity || 0);
    totalCost += price * quantity;

    const div = document.createElement("div");
    div.className = "item";

    div.innerHTML = `
      <div class="itemnonimage">
        <h1>Book ID: ${item.book_id}</h1>
        <h3>Unit Price: $${price.toFixed(2)}</h3>
        <h3>Quantity in cart: ${quantity}</h3>
      </div>
    `;

    main.appendChild(div);
  });

  document.getElementById("totalCost").textContent =
    `Total: $${totalCost.toFixed(2)}`;
}

//checkout
checkoutBtn.addEventListener("click", async () => {
  if (!currentOrder.length) return alert("Cart is empty");

  try {
    const res = await apiFetch("/checkout", { method: "POST" });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Checkout failed: ${text}`);
    }

    const data = await res.json();
    alert(`Order placed! Order ID: ${data.order_id}`);

    currentOrder = [];
    renderCart(currentOrder);
    await loadCart();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

/* below works but is most basic, upgrade test above
checkoutBtn.addEventListener("click", async () => {
  try {
    const res = await apiFetch("/checkout", { method: "POST" });
    const data = await res.json();
    alert(`Order placed! Order ID: ${data.order_id}`);
    await loadCart();
  } catch (err) {
    alert(err.message);
  }
});
*/

// Button to call refreshAuth function
refreshAuthBtn.addEventListener("click", async () => {
  await refreshAuth();
  await loadCart();
});
// Can be removed once cart is working again


initPage();






