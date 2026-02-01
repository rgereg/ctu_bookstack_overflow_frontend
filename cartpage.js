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
        main.innerHTML = "<div id='message'><p>No orders found</p></div>";
        return;
    }

    let totalCost = 0;
  
    data.forEach(item => {

        const price = Number(item.books.price);
        const quantity = Number(item.quantity);

        totalCost += price * quantity;
      
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
        <img
          src="http://ajvplpbxsrxgdldcosdf.supabase.co/storage/v1/object/public/${item.books.image_path}"
          alt="${item.books.title}"
          onerror="this.src='http://ajvplpbxsrxgdldcosdf.supabase.co/storage/v1/object/public/image/book/cover.jpg';"
        />

        <div class="itemnonimage">
            <h1>Title: ${item.books.title}</h1>
            <h2>ISBN: ${item.books.isbn}</h2>
            <h3>Unit Price: ${Number(item.books.price).toFixed(2)}</h3>
            <h3>Quantity in cart: ${item.quantity}</h3>
        </div>
        `;

        main.appendChild(div);
    });
    document.getElementById("totalCost").textContent = `Total: $${totalCost.toFixed(2)}`;
}

//checkout
checkoutBtn.addEventListener("click", async () => {
  if (!cart.length) return alert("Cart is empty");

  const payload = cart.map(item => ({
    book_id: item.id,
    quantity: item.quantity,
    unit_price: item.price
  }));

  try {
    const token = session.access_token;

    const res = await fetch(`${API_BASE}/checkout`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items: payload })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Checkout failed: ${text}`);
    }

    const data = await res.json();
    alert(`Order placed! Order ID: ${data.order_id}`);

    cart = [];
    renderCart();
    await loadOrders();

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});

// Button to call refreshAuth function
refreshAuthBtn.addEventListener("click", async () => {
  await refreshAuth();
  await loadCart();
});
// Can be removed once cart is working again


initPage();



