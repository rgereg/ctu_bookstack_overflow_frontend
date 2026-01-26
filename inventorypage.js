import { initAuth, userRole, apiFetch } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");
const searchInput = document.getElementById("search");
const addBook = document.getElementById("addBook");
const addForm = document.getElementById("add-form-container");
const bookForm = document.getElementById("bookForm");

let inventory = [];

if (!session || userRole !== "employee") {
        document.getElementById("main").innerHTML = "<div id='message'><p>This page is for Employees Only.</p></div>";
}
else {
async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    if (!res.ok) throw new Error("Failed to fetch books");

    inventory = await res.json();
    renderInventory(inventory);
  } catch (err) {
    console.error(err);
    main.innerHTML = "<p>Error loading books.</p>";
  }
}

function renderInventory(data) {
    main.innerHTML = "";

    if (!data.length) {
        main.innerHTML = "<p>No books found.</p>";
        return;
    }

    data.forEach(book => {
        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
        <img
          src="http://ajvplpbxsrxgdldcosdf.supabase.co/storage/v1/object/public/${book.image_path}"
          alt="${book.title}"
          onerror="this.src='http://ajvplpbxsrxgdldcosdf.supabase.co/storage/v1/object/public/image/book/cover.jpg';"
        />
      
        <div class="itemnonimage">
          <h1>${book.title}</h1>
          <p>ISBN: ${book.isbn}</p>
          <h3>$${Number(book.price).toFixed(2)} <button class="priceUpdateBtn" data-isbn="${book.isbn}">Update Price</button></h3>
          <h3>Qty. ${book.quantity} <button class="quantUpdateBtn" data-isbn="${book.isbn}">Update Quantity</button></h3>
        </div>
      `;

      main.appendChild(div);
    });
  wireOrderButtons();
}

function wireOrderButtons() {
  document.querySelectorAll(".priceUpdateBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const isbn = btn.dataset.isbn;
      await updatePrice(isbn);
    });
  });
  document.querySelectorAll(".quantUpdateBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const isbn = btn.dataset.isbn;
      await updateQuant(isbn);
    });
  });
}

// updatePrice and updateQuant are placeholder functions for updating price and quantity, gonna mess with backend to add them in
async function updatePrice(isbn) {
  console.log(`Attempted to update price for ISBN: ${isbn}`);

  const input = prompt("Enter new price:");
  const price = parseFloat(input);

  if (isNaN(price) || price <= 0) {
    alert("Price must be a number greater than 0");
    return;
  }

  try {
    const res = await apiFetch("/update_price", {
      method: "POST",
      body: JSON.stringify({ isbn, price })
    });
    
    if (!res.ok) throw new Error("Update failed");
    const data = await res.json();
    alert(`Price updated successfully for ISBN ${isbn}`);
    console.log("Backend response:", data);
  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
}

async function updateQuant(isbn) {
  console.log(`Attempted to update quantity for ISBN: ${isbn}`)

  const quantity = Number(prompt("Enter quantity:"));
  if (!Number.isInteger(quantity) || quantity < 0) {
    alert("Quantity in stock can't be less than 0");
    return;
  }
  
  try {
    const res = await apiFetch(`/update_quantity`, {
      method: "POST",
      body: JSON.stringify({ isbn, quantity })
    });

    if (!res.ok) {
      throw new Error("Update failed");
    }
    
    const data = await res.json();
    alert("Quantity has been updated");
    console.log("Backend response:", data);
  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
}

searchInput?.addEventListener("input", e => {
  const q = e.target.value.toLowerCase();

  const filtered = inventory.filter(book =>
    book.title.toLowerCase().includes(q) ||
    book.author.toLowerCase().includes(q) ||
    book.isbn.includes(q)
  );

  renderInventory(filtered);
});

addBook?.addEventListener("click", () => {
  addForm.classList.toggle("hidden");
});

bookForm?.addEventListener("submit", async e => {
  e.preventDefault();

  const newBook = {
    title: title.value,
    author: author.value,
    isbn: isbn.value,
    description: description.value,
    price: parseFloat(price.value),
    quantity: parseInt(quantity.value)
  };

  try {
    const res = await apiFetch("/books", {
      method: "POST",
      body: JSON.stringify(newBook)
    });

    if (!res.ok) throw new Error("Failed to add book");
    const data = await res.json();
    inventory.push(data);
    renderInventory(inventory);
  } catch (err) {
    console.error(err);
    alert("Failed to add book");
  }
});
}

(async function initPage() {
    await initAuth();
    await loadInventory();

})();





