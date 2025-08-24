var inputs = document.querySelectorAll('#productForm input');
var searchProductInput = document.getElementById('searchProduct');
var productDescription = document.getElementById('productDescription');
var cards = document.getElementById('cards');
var products = loadFromLocalStorage();
var currentIndex = null;

displayProducts();

function validateProductForm(inputs, productDescription) {
  const nameValid = /^[a-zA-Z0-9_\-\s]{3,16}$/;
  const priceValid = /^\d+(\.\d{1,2})?$/;
  const categoryValid = /^[a-zA-Z\s]{3,20}$/;
  const descriptionValid = /^.{0,200}$/;
  const imageValid = /[a-z]{3,30}.(jpg|jpeg|png|gif)$/i;

  if (!nameValid.test(inputs[0].value)) {
    alert(
      'Name must be 3-16 characters and can only contain letters, numbers, underscores and hyphens'
    );
    return false;
  }

  if (!priceValid.test(inputs[1].value)) {
    alert('Price must be a valid number with up to 2 decimal places');
    return false;
  }

  if (!categoryValid.test(inputs[2].value)) {
    alert(
      'Category must be 3-20 characters and can only contain letters and spaces'
    );
    return false;
  }

  if (!inputs[3].files[0] || !imageValid.test(inputs[3].files[0].name)) {
    alert('Please select a valid image file (JPG, JPEG, PNG, GIF)');
    return false;
  }

  if (!descriptionValid.test(productDescription.value)) {
    alert('Description must be 200 characters or less');
    return false;
  }

  return true;
}

function addProduct() {
  if (!validateProductForm(inputs, productDescription)) return false;

  var file = inputs[3].files[0];
  var reader = new FileReader();

  reader.onload = function (e) {
    var product = {
      name: inputs[0].value,
      price: inputs[1].value,
      category: inputs[2].value,
      description: productDescription.value,
      image: e.target.result,
      fileName: file.name,
    };

    if (currentIndex === null) {
      products.push(product);
    } else {
      products[currentIndex] = product;
      currentIndex = null;
    }

    saveToLocalStorage();
    displayProducts();
    clearForm();
  };

  reader.readAsDataURL(file);
}

function displayProducts() {
  var card;
  cards.innerHTML = '';

  if (products.length === 0) {
    cards.innerHTML = '<p class="text-center">No products found</p>';
    return;
  }

  products.forEach((product, index) => {
    card = `
      <div class="my-card col-md-6 col-lg-4 col-xl-3" data-index="${index}">
        <div class="inner rounded-3 overflow-hidden shadow-lg">
          ${product.image ? `<img src="${product.image}" alt="${product.name}" class="img-fluid w-100" style="height: 200px;"></img>` : null}
          <div class="p-2">
            <span class="badge bg-info text-white">Index: ${index}</span>
            <h5>Product Name : ${product.name}</h5>
            <p><strong>Price:</strong> $${product.price}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
          </div>
          <div class="border-top bg-body-tertiary p-2 d-flex justify-content-center gap-2">
            <button class="btn btn-outline-warning btn-sm" onclick="editProduct(${index})">
              <i class="fa-solid fa-pen-to-square"></i> Edit
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${index})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
    cards.innerHTML += card;
  });
}

function editProduct(index) {
  var product = products[index];
  inputs[0].value = product.name;
  inputs[1].value = product.price;
  inputs[2].value = product.category;
  productDescription.value = product.description;
  currentIndex = index;
  document.querySelector('button[type="submit"]').textContent =
    'Update Product';
}

function deleteProduct(index) {
  if (confirm('Are you sure you want to delete this product?')) {
    products.splice(index, 1);
    saveToLocalStorage();
    displayProducts();
  }
}

function clearForm() {
  currentIndex = null;
  inputs[0].value = '';
  inputs[1].value = '';
  inputs[2].value = '';
  inputs[3].value = '';
  productDescription.value = '';
  document.querySelector('button[type="submit"]').textContent = 'Add Product';
}

function saveToLocalStorage() {
  localStorage.setItem('products', JSON.stringify(products));
}

function loadFromLocalStorage() {
  try {
    var storedProducts = localStorage.getItem('products');
    return storedProducts ? JSON.parse(storedProducts) : [];
  } catch (e) {
    console.error('Error loading products:', e);
    return [];
  }
}
