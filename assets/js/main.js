const elements = {
  form: document.getElementById('productForm'),
  inputs: document.querySelectorAll('#productForm input'),
  searchInput: document.getElementById('searchProduct'),
  description: document.getElementById('productDescription'),
  cards: document.getElementById('cards'),
  message: document.getElementById('message') || createMessageElement(),
  submitBtn: document.querySelector('button[type="submit"]'),
};

let products = loadFromLocalStorage();
let currentIndex = null;

initApp();

function initApp() {
  displayProducts();
  setupEventListeners();
}

function setupEventListeners() {
  if (elements.searchInput) {
    elements.searchInput.addEventListener(
      'input',
      debounce(searchProducts, 300)
    );
  }

  if (elements.form) {
    elements.form.addEventListener('submit', handleSubmit);
  }

  elements.inputs.forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid', 'is-valid');
    });
  });
}

function handleSubmit(e) {
  e.preventDefault();
  addProduct();
}

const validators = {
  name: /^[\w\s-]{3,16}$/,
  price: /^\d+(\.\d{1,2})?$/,
  category: /^[a-zA-Z\s]{3,20}$/,
  description: /^.{0,200}$/,
  image: /\.(jpg|jpeg|png|gif)$/i,
};

function validateProductForm() {
  let isValid = true;

  if (!validators.name.test(elements.inputs[0].value.trim())) {
    showError(
      elements.inputs[0],
      'Name must be 3-16 characters (letters, numbers, underscores, hyphens, spaces)'
    );
    isValid = false;
  }

  if (!validators.price.test(elements.inputs[1].value)) {
    showError(
      elements.inputs[1],
      'Price must be a valid number with up to 2 decimal places'
    );
    isValid = false;
  }

  if (!validators.category.test(elements.inputs[2].value.trim())) {
    showError(
      elements.inputs[2],
      'Category must be 3-20 characters (letters and spaces only)'
    );
    isValid = false;
  }

  const file = elements.inputs[3].files[0];
  if (!file) {
    showError(elements.inputs[3], 'Please select an image file');
    isValid = false;
  } else if (!validators.image.test(file.name)) {
    showError(
      elements.inputs[3],
      'Please select a valid image (JPG, JPEG, PNG, GIF)'
    );
    isValid = false;
  }

  if (!validators.description.test(elements.description.value)) {
    showError(
      elements.description,
      'Description must be 200 characters or less'
    );
    isValid = false;
  }

  return isValid;
}

function showError(element, message) {
  element.classList.add('is-invalid');
  element.focus();
  showMessage('warning', message);
}

function addProduct() {
  if (!validateProductForm()) return false;

  const file = elements.inputs[3].files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const product = createProductObject(e.target.result, file.name);

    if (currentIndex === null) {
      products.push(product);
      showMessage('success', 'Product added successfully!');
    } else {
      products[currentIndex] = product;
      currentIndex = null;
      showMessage('success', 'Product updated successfully!');
    }

    saveToLocalStorage();
    displayProducts();
    clearForm();
  };

  reader.readAsDataURL(file);
}

function createProductObject(imageData, fileName) {
  return {
    name: elements.inputs[0].value.trim(),
    price: elements.inputs[1].value,
    category: elements.inputs[2].value.trim(),
    description: elements.description.value,
    image: imageData,
    fileName: fileName,
    id: Date.now(),
  };
}

function displayProducts() {
  if (products.length === 0) {
    elements.cards.innerHTML = '<p class="text-center">No products found</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  const container = document.createElement('div');
  container.className = 'row';

  products.forEach((product, index) => {
    const card = createProductCard(product, index);
    container.innerHTML += card;
  });

  fragment.appendChild(container);
  elements.cards.innerHTML = '';
  elements.cards.appendChild(fragment);
}

function createProductCard(product, index) {
  return `
        <div class="col-md-6 col-lg-4 col-xl-3 mb-3">
            <div class="card h-100 shadow-sm">
                ${
                  product.image
                    ? `
                    <img src="${product.image}" alt="${product.name}" 
                         class="card-img-top" style="height: 200px; object-fit: cover;">
                `
                    : ''
                }
                <div class="card-body">
                    <span class="badge bg-info mb-2">#${index}</span>
                    <h6 class="card-title">${product.name}</h6>
                    <p class="card-text mb-1"><small>Price: $${product.price}</small></p>
                    <p class="card-text mb-1"><small>Category: ${product.category}</small></p>
                    ${
                      product.description
                        ? `
                        <p class="card-text"><small>${truncateText(product.description, 50)}</small></p>
                    `
                        : ''
                    }
                </div>
                <div class="card-footer bg-transparent border-0 pb-3">
                    <div class="btn-group w-100">
                        <button class="btn btn-outline-warning btn-sm" onclick="editProduct(${index})">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${index})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function editProduct(index) {
  const product = products[index];
  elements.inputs[0].value = product.name;
  elements.inputs[1].value = product.price;
  elements.inputs[2].value = product.category;
  elements.description.value = product.description;
  currentIndex = index;

  elements.submitBtn.textContent = 'Update Product';
  elements.submitBtn.classList.replace('btn-primary', 'btn-warning');

  showMessage('info', 'Editing product. Make changes and click Update');
}

function deleteProduct(index) {
  if (confirm('Are you sure you want to delete this product?')) {
    products.splice(index, 1);
    saveToLocalStorage();
    displayProducts();
    showMessage('success', 'Product deleted successfully!');
  }
}

function clearForm() {
  currentIndex = null;
  elements.form.reset();

  elements.inputs.forEach((input) => {
    input.classList.remove('is-valid', 'is-invalid');
  });

  elements.submitBtn.textContent = 'Add Product';
  elements.submitBtn.classList.replace('btn-warning', 'btn-primary');
}

function searchProducts() {
  const query = elements.searchInput.value.toLowerCase().trim();

  if (!query) {
    displayProducts();
    return;
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
  );

  displayFilteredProducts(filteredProducts, query);
}

function displayFilteredProducts(filteredProducts, query) {
  if (filteredProducts.length === 0) {
    elements.cards.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-solid fa-search fa-2x text-muted mb-3"></i>
                <p class="text-muted">No products found for "${query}"</p>
            </div>
        `;
    return;
  }

  const fragment = document.createDocumentFragment();
  const container = document.createElement('div');
  container.className = 'row';

  filteredProducts.forEach((product, index) => {
    const card = createProductCard(product, index);
    container.innerHTML += card;
  });

  fragment.appendChild(container);
  elements.cards.innerHTML = '';
  elements.cards.appendChild(fragment);
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('products', JSON.stringify(products));
  } catch (e) {
    console.error('Storage error:', e);
    showMessage('danger', 'Error saving products. Storage may be full.');
  }
}

function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem('products');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Load error:', e);
    return [];
  }
}

function createMessageElement() {
  const div = document.createElement('div');
  div.id = 'message';
  div.className = 'position-fixed top-0 start-50 translate-middle-x mt-3 z-3';
  div.style.zIndex = '1050';
  document.body.appendChild(div);
  return div;
}

function showMessage(type, text) {
  const iconMap = {
    success: 'fa-check',
    warning: 'fa-exclamation-triangle',
    danger: 'fa-times',
    info: 'fa-info',
  };

  elements.message.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
            <i class="fa-solid ${iconMap[type] || 'fa-info'} me-2"></i>
            ${text}
            <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert"></button>
        </div>
    `;

  setTimeout(() => {
    const alert = elements.message.querySelector('.alert');
    if (alert) {
      alert.classList.remove('show');
      setTimeout(() => (elements.message.innerHTML = ''), 300);
    }
  }, 3000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

if (!document.querySelector('[data-fa-processed]')) {
  const faScript = document.createElement('script');
  faScript.src =
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js';
  document.head.appendChild(faScript);
}
