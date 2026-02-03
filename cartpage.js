import { initAuth, userRole, apiFetch, refreshAuth, supabaseClient } from "./loginpage.js";

const SUPABASE_URL = "https://ajvplpbxsrxgdldcosdf.supabase.co";
const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");
const refreshAuthBtn = document.getElementById("refreshAuthBtn");
const checkoutBtn = document.getElementById("checkoutBtn");

let currentOrder = [];
let session = null;

// Going to be messing with this more, using old cart loading function that was in the HTML for the page

async function initPage() {
  const { data } = await supabaseClient.auth.getSession();
  session = data.session;

  if (!session || userRole !== "customer") {
    cartcontainer.innerHTML = "<div id='main'><div id='message'><p>Please log in as a customer to view your cart.</p></div></div>";
    return;
  }
  await loadCart();
}

async function loadCart() {
    try {
      const res = await apiFetch("/cart");
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
      <img
        src="${SUPABASE_URL}/storage/v1/object/public/${item.books.image_path || 'image/book/cover.jpg'}"
        alt="${item.books.title || 'Book'}"
        onerror="this.src='${SUPABASE_URL}/storage/v1/object/public/image/book/cover.jpg';"
      />
      <div class="itemnonimage">
        <h1>Title: ${item.books.title}</h1>
        <h2>ISBN: ${item.books.isbn}</h2>
        <h3>Unit Price: $${price.toFixed(2)}</h3>
        <h3>Quantity in cart: <input type="number" min="1" value="${quantity}" id="qty-${item.id}" style="width: 60px;"></h3>
        <button id="update-${item.id}">Update Quantity</button>
        <button id="remove-${item.id}">Remove Book</button>
      </div>
    `;

    main.appendChild(div);

    document.getElementById(`update-${item.id}`).addEventListener("click", async () => {
      const newQty = Number(document.getElementById(`qty-${item.id}`).value);
      if (!newQty || newQty < 1) {
        alert("Enter a valid quantity");
        return;
      }

      try {
        const res = await apiFetch(`/cart`, {
          method: "PATCH",
          body: JSON.stringify({ isbn: item.books.isbn, quantity: newQty })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to update quantity");
        alert("Quantity updated");
        await loadCart();
      } catch (err) {
        alert(err.message);
      }
    });

    document.getElementById(`remove-${item.id}`).addEventListener("click", async () => {
      if (!confirm(`Remove "${item.books.title}" from cart?`)) return;

      try {
        const res = await apiFetch(`/cart/${item.books.isbn}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to remove book");
        alert("Book removed");
        await loadCart();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  document.getElementById("totalCost").textContent = `Total: $${totalCost.toFixed(2)}`;
}

checkoutBtn.addEventListener("click", async () => {
  try {
    const createRes = await fetch("/checkout/create-order", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    const createData = await createRes.json();
    console.log("[DEBUG] Create order response:", createData);

    if (!createRes.ok) {
      throw new Error(createData.detail || "Failed to create order");
    }

    const addRes = await fetch("/checkout/add-items", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: createData.order_id, cart_id: createData.cart_id })
    });

    const addData = await addRes.json();
    console.log("[DEBUG] Add items response:", addData);

    if (!addRes.ok) {
      throw new Error(addData.detail || "Failed to add items to order");
    }

    const clearRes = await fetch("/checkout/clear-cart", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: createData.cart_id })
    });

    const clearData = await clearRes.json();
    console.log("[DEBUG] Clear cart response:", clearData);

    if (!clearRes.ok) {
      throw new Error(clearData.detail || "Failed to clear cart");
    }

    alert("Checkout successful! Order ID: " + createData.order_id);
  } catch (err) {
    console.error("[DEBUG] Checkout failed:", err);
    alert("Checkout failed: " + err.message);
  }
});



// Button to call refreshAuth function
refreshAuthBtn.addEventListener("click", async () => {
  await refreshAuth();
  await loadCart();
});
// Can be removed once cart is working again

initPage();











