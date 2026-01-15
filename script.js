fetch('/api/inventory')
  .then(res => res.json())
  .then(data => {
    const main = document.getElementById('main');

    data.forEach(item => {
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <h1>${item.title}</h1>
        <h2>by ${item.author}</h2>
        <img src="image/book/${item.isbn}.jpg" />
        <p>ISBN: ${item.isbn}</p>
        <p>${item.description}</p>
        <div class="shareline">
        <h3 class="price">$${item.price.toFixed(2)}</h3>
        <h3 class="quant">Qt. ${item.quantity}</h3>
        </div>
      `;
      main.appendChild(div);
    });
  });
