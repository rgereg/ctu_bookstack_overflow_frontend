import { initAuth, userRole, apiFetch } from "./loginpage.js";

const API_BASE = "https://ctu-bookstack-overflow-backend.onrender.com";

const main = document.getElementById("main");
const searchInput = document.getElementById("search");
const addBook = document.getElementById("addBook");
const addForm = document.getElementById("add-form-container");
const bookForm = document.getElementById("bookForm");

let inventory = [];
let session = null;

async function initPage() {
  session = await initAuth();

  if (!session || userRole !== "employee") {
    main.innerHTML = "<div id='message'><p>This page is for Employees Only.</p></div>";
    return;
  }
  else {
        await loadInventory();
  }
}
async function loadInventory() {
  try {
    const res = await fetch(`${API_BASE}/books`);
    if (!res.ok) throw new Error("Failed to fetch books");

    inventory = await res.json();
    renderInventory(inventory);
  } catch (err) {
    console.error(err);
    main.innerHTML = "<div id='message'><p>Error loading books.</p></div>";
  }
}

function renderInventory(data) {
    main.innerHTML = "";

    if (!data.length) {
        main.innerHTML = "<div id='message'><p>No books found.</p></div>";
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
          <h3>  $<span class="price" data-isbn="${book.isbn}"> 
                ${Number(book.price).toFixed(2)} </span>
                <button class="priceUpdateBtn" data-isbn="${book.isbn}">Update Price</button>
          </h3>

          <h3>
                Qty. <span class="quantity" data-isbn="${book.isbn}">
                ${book.quantity} </span>
                <button class="quantUpdateBtn" data-isbn="${book.isbn}">Update Quantity</button>
          </h3>
          <p class="editHint hidden">Input a new value, then press Enter to save, or Esc to cancel.</p>

        </div>
      `;

      main.appendChild(div);
    });
  wireUpdateButtons();
}

function wireUpdateButtons() {
  document.querySelectorAll(".priceUpdateBtn").forEach(btn => {
    btn.onclick = () => enableInlineEdit(btn, "price");
  });

  document.querySelectorAll(".quantUpdateBtn").forEach(btn => {
    btn.onclick = () => enableInlineEdit(btn, "quantity");
  });
}

/* Helper: Show Inline Status:
  Inline success/error message for book update.
  * Instead of popups, we will:
    - Show a small status message at the bottom of the book card
    - Green text for success
    - Red text for errors
    - Auto-hide after a few seconds*/
  function showInlineStatus(card, message, type = "success") {
  let status = card.querySelector(".inline-status");

  if (!status) {
    status = document.createElement("div");
    status.className = "inline-status hidden";
    card.appendChild(status);
  }

  status.textContent = message;
  status.className = `inline-status ${type}`;
  status.classList.remove("hidden");

  setTimeout(() => {
    status.classList.add("hidden");
  }, 3000);
}

/** ENABLE INLINE EDIT OF QTY / PRICE
 * Enables inline editing for a single field (price or quantity) on a book item.
 *
 * This function:
 * 1. Locates the correct book card in the DOM using the ISBN
 * 2. Replaces the displayed value (price or quantity) with an editable input
 * 3. Pre-fills the input with the current value
 * 4. Converts the "Update" button into a "Save" button
 * 5. Sends the update to the backend using the unified PUT /books/{isbn} route
 * 6. Updates the UI only after the database confirms success
 *
 * @param {string} isbn - ISBN of the book being edited
 * @param {"price"|"quantity"} field - Which field to edit
 - Keeps everything scoped to the clicked card
 - Adds Cancel button
 - Shows the hint line
 - Enter submits
 - Esc cancels
 */
function enableInlineEdit(btn, field) {
  const isbn = btn.dataset.isbn;
  
  // Locate the book card for the clicked button
  const item = btn.closest(".item");
  if (!item) return;

  // Disable the other update button on this card while editing
  const otherBtn = item.querySelector(
    field === "price" ? ".quantUpdateBtn" : ".priceUpdateBtn"
  );
  if (otherBtn) otherBtn.disabled = true;

  // Find the correct value span in THIS card
  const valueSpan = item.querySelector(
    field === "price"
      ? `.price[data-isbn="${CSS.escape(isbn)}"]`
      : `.quantity[data-isbn="${CSS.escape(isbn)}"]`
  );
  if (!valueSpan) return;

  // Reference the full book card for inline status messages
const card = valueSpan.closest(".item");
  
  // Instruction line at the bottom of the card
  const hint = item.querySelector(".editHint");

  // If already editing, treat click as submit
  const existingInput = valueSpan.querySelector("input");
  if (existingInput) {
    existingInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    return;
  }

  // Save original state so we can revert cleanly
  const originalText = valueSpan.textContent.trim();
  const originalBtnText = btn.textContent;

  // Enter edit mode: replace span text with an input
  const input = document.createElement("input");
  input.type = "number";
  input.step = field === "price" ? "0.01" : "1";
  input.min = "0";
  input.value = originalText;
  input.style.width = "90px";

  valueSpan.textContent = "";
  valueSpan.appendChild(input);

  // Turn Update button into Submit
  btn.textContent = "Submit";

  // Create a Cancel button (only while editing)
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "cancelUpdateBtn";
  cancelBtn.style.marginLeft = "6px";

  // Insert cancel button right after the submit button
  btn.insertAdjacentElement("afterend", cancelBtn);

  // Show hint line
  if (hint) hint.classList.remove("hidden");

  // Helper: revert UI back to original state
  const cancelEdit = () => {
    valueSpan.textContent = originalText;
    btn.textContent = originalBtnText;
    cancelBtn.remove();
    if (hint) hint.classList.add("hidden");
    if (otherBtn) otherBtn.disabled = false;
    wireUpdateButtons(); // restore normal click handlers
  };

  // Helper: submit the change
    const submitEdit = async () => {
    const raw = input.value.trim();
    const newValue = field === "price" ? parseFloat(raw) : Number(raw);

    // Validate
    if (field === "price") {
      if (Number.isNaN(newValue) || newValue < 0) {
        showInlineStatus(card, "Price cannot be less than 0.00", "error");
        return;
      }
    } else {
      if (!Number.isInteger(newValue) || newValue < 0) {
        showInlineStatus(card, "Quantity cannot be less than 0", "error");
        return;
      }
    }

    // NO Operation Check: Do NOT submit if value did not change
  if (field === "price") {
    const oldValue = parseFloat(originalText);
    if (!Number.isNaN(oldValue) && newValue === oldValue) {
      showInlineStatus(card, "No changes to save.", "error");
      cancelEdit();
      return;
    }
  } else {
    const oldValue = Number(originalText);
    if (Number.isInteger(oldValue) && newValue === oldValue) {
      showInlineStatus(card, "No changes to save.", "error");
      cancelEdit();
      return;
    }
  }
      
  const book = inventory.find(b => b.isbn === isbn);
if (!book) {
  showInlineStatus(card, "Book not found in local inventory.", "error");
  return;
}

const payload =
  field === "price"
    ? { price: newValue, quantity: book.quantity }
    : { price: book.price, quantity: newValue };
  

    try {
      // Optional: prevent double submit
      btn.disabled = true;
      cancelBtn.disabled = true;

      const res = await apiFetch(`/books/${encodeURIComponent(isbn)}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Update failed");
      }

      // Update UI value after DB confirms success
      valueSpan.textContent =
        field === "price" ? newValue.toFixed(2) : String(newValue);

      // Update local inventory array so search/filter stays accurate
      const i = inventory.findIndex(b => b.isbn === isbn);
      if (i !== -1) {
        if (field === "price") inventory[i].price = newValue;
        else inventory[i].quantity = newValue;
      }


      // Restore buttons and hint
      btn.textContent = originalBtnText;
      btn.disabled = false;
      cancelBtn.remove();
      if (hint) hint.classList.add("hidden");
      if (otherBtn) otherBtn.disabled = false;
      wireUpdateButtons();

      showInlineStatus(card, "Update successful", "success");
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      cancelBtn.disabled = false;
      showInlineStatus(card, err.message || "Update failed", "error");
    }
  };

  // Cancel button click
  cancelBtn.onclick = cancelEdit;

  // Keyboard support: Enter submits, Esc cancels
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitEdit();
    if (e.key === "Escape") cancelEdit();
  });

  // Focus for fast editing
  input.focus();
  input.select();
}



/*
// updatePrice and updateQuant are placeholder functions for updating price and quantity, gonna mess with backend to add them in
async function updatePrice(isbn) {
  console.log(`Attempted to update price for isbn: ${isbn}`);

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
    alert(`Price updated successfully for isbn ${isbn}`);
    console.log("Backend response:", data);
  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
}

async function updateQuant(isbn) {
  console.log(`Attempted to update quantity for isbn: ${isbn}`)

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
    alert(`Quantity has been updated for isbn: ${isbn}`);
    console.log("Backend response:", data);
  } catch (err) {
    console.error(err);
    alert("Update failed");
  }
}
*/
  
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
    const res = await apiFetch(`/books`, {
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

(async function initPage() {
    await initAuth();
    await loadInventory();

})();
//initPage(); why






