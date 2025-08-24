const elements = {
  btn_submit: document.querySelector('[type="submit"]'),
  inputs: [
    document.getElementById('productName'),
    document.getElementById('productPrice'),
    document.getElementById('productCategory'),
    document.getElementById('productImage'),
  ],
  description: document.getElementById('productDescription'),
  searchInput: document.getElementById('searchProduct'),
  cards: document.getElementById('cards'),
  message: document.getElementById('message') || createMessageElement(),
  submitBtn: document.querySelector('button[type="submit"]'),
  clearBtn: document.getElementById('clearForm'),
};

let products = loadFromLocalStorage();
let currentIndex = null;
let currentStep = 0;

initApp();

function initApp() {
  displayProducts();
  setupEventListeners();
  updateStepIndicator();
}

function setupEventListeners() {
  if (elements.searchInput) {
    elements.searchInput.addEventListener(
      'input',
      debounce(searchProducts, 300)
    );
  }

  if (elements.btn_submit) {
    elements.btn_submit.addEventListener('click', handleSubmit);
  }

  if (elements.clearBtn) {
    elements.clearBtn.addEventListener('click', clearForm);
  }

  // إضافة مستمعي الأحداث للحقول مع التركيز على الخطأ
  elements.inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid', 'is-valid');
      if (validateField(input, index)) {
        input.classList.add('is-valid');
        moveToNextStep(index);
      }
    });

    input.addEventListener('blur', () => {
      validateField(input, index);
    });
  });

  elements.description.addEventListener('input', () => {
    elements.description.classList.remove('is-invalid', 'is-valid');
    if (validateField(elements.description, 4)) {
      elements.description.classList.add('is-valid');
    }
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
  let firstErrorField = null;

  for (let i = 0; i < elements.inputs.length; i++) {
    if (!validateField(elements.inputs[i], i)) {
      isValid = false;
      if (!firstErrorField) {
        firstErrorField = elements.inputs[i];
      }
    }
  }

  if (!validateField(elements.description, 4)) {
    isValid = false;
    if (!firstErrorField) {
      firstErrorField = elements.description;
    }
  }

  // التركيز على أول حقل به خطأ
  if (firstErrorField) {
    firstErrorField.focus();
    showError(
      firstErrorField,
      getErrorMessage(firstErrorField, elements.inputs.indexOf(firstErrorField))
    );
  }

  return isValid;
}

function validateField(element, index) {
  let isValid = true;
  let value = element.value.trim();

  if (index === 3) {
    // حقل الصورة
    const file = element.files[0];
    if (!file) {
      isValid = false;
    } else if (!validators.image.test(file.name)) {
      isValid = false;
    }
  } else if (index === 4) {
    // حقل الوصف
    if (!validators.description.test(value)) {
      isValid = false;
    }
  } else {
    if (!value) {
      isValid = false;
    } else if (index === 0 && !validators.name.test(value)) {
      isValid = false;
    } else if (index === 1 && !validators.price.test(value)) {
      isValid = false;
    } else if (index === 2 && !validators.category.test(value)) {
      isValid = false;
    }
  }

  if (!isValid) {
    element.classList.add('is-invalid');
    element.classList.remove('is-valid');
  } else {
    element.classList.remove('is-invalid');
    element.classList.add('is-valid');
  }

  return isValid;
}

function getErrorMessage(element, index) {
  switch (index) {
    case 0:
      return 'يجب إدخال اسم منتج صالح (3-16 حرفاً، يمكن أن يحتوي على أحرف، أرقام، مسافات، underscores و hyphens)';
    case 1:
      return 'يجب إدخال سعر صالح (رقم مع خانتين عشرييتين كحد أقصى)';
    case 2:
      return 'يجب إدخال تصنيف صالح (3-20 حرفاً، أحرف ومسافات فقط)';
    case 3:
      return 'يجب اختيار صورة بصيغة مناسبة (JPG, JPEG, PNG, GIF)';
    case 4:
      return 'الوصف يجب أن لا يتجاوز 200 حرف';
    default:
      return 'هذا الحقل مطلوب';
  }
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
      showMessage('success', 'تم إضافة المنتج بنجاح!');
    } else {
      products[currentIndex] = product;
      currentIndex = null;
      showMessage('success', 'تم تحديث المنتج بنجاح!');
    }

    saveToLocalStorage();
    displayProducts();
    clearForm();

    // التبديل إلى تبويب المنتجات بعد الإضافة
    const productsTab = document.getElementById('products-tab');
    if (productsTab) {
      new bootstrap.Tab(productsTab).show();
    }
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
    elements.cards.innerHTML = '<p class="text-center">لا توجد منتجات</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  const container = document.createElement('div');
  container.className = 'row g-3 mt-3';

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
              <div class="my-card col-md-6 col-lg-4 col-xl-3" data-index="${index}">
                  <div class="inner rounded-3 overflow-hidden shadow-lg">
                      ${product.image ? `<img src="${product.image}" alt="${product.name}" class="img-fluid w-100" style="height: 200px;"></img>` : ''}
                      <div class="p-2">
                          <span class="badge bg-info text-white">Index: ${index}</span>
                          <h5>اسم المنتج: ${product.name}</h5>
                          <p><strong>السعر:</strong> $${product.price}</p>
                          <p><strong>التصنيف:</strong> ${product.category}</p>
                          ${product.description ? `<p><strong>الوصف:</strong> ${truncateText(product.description, 16)}</p>` : ''}
                      </div>
                      <div class="border-top bg-body-tertiary p-2 d-flex justify-content-center gap-2">
                          <button class="btn btn-outline-warning btn-sm" onclick="editProduct(${index})">
                              <i class="fa-solid fa-pen-to-square"></i> تعديل
                          </button>
                          <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${index})">
                              <i class="fa-solid fa-trash"></i> حذف
                          </button>
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

  elements.submitBtn.textContent = 'تحديث المنتج';
  elements.submitBtn.classList.replace('btn-primary', 'btn-warning');

  showMessage('info', 'جاري تعديل المنتج. قم بإجراء التغييرات وانقر على تحديث');

  // التبديل إلى تبويب النموذج
  const formTab = document.getElementById('form-tab');
  if (formTab) {
    new bootstrap.Tab(formTab).show();
  }
}

function deleteProduct(index) {
  if (confirm('هل أنت متأكد من أنك تريد حذف هذا المنتج؟')) {
    products.splice(index, 1);
    saveToLocalStorage();
    displayProducts();
    showMessage('success', 'تم حذف المنتج بنجاح!');
  }
}

function clearForm() {
  currentIndex = null;

  elements.inputs.forEach((input) => {
    input.classList.remove('is-valid', 'is-invalid');
    input.value = '';
  });

  elements.description.classList.remove('is-valid', 'is-invalid');
  elements.description.value = '';

  elements.submitBtn.textContent = 'إضافة المنتج';
  elements.submitBtn.classList.replace('btn-warning', 'btn-primary');

  currentStep = 0;
  updateStepIndicator();

  showMessage('info', 'تم مسح النموذج');
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
                      <p class="text-muted">لم يتم العثور على منتجات لـ "${query}"</p>
                  </div>
              `;
    return;
  }

  const fragment = document.createDocumentFragment();
  const container = document.createElement('div');
  container.className = 'row g-3 mt-3';

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
    showMessage('danger', 'خطأ في حفظ المنتجات. قد يكون التخزين ممتلئاً.');
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

function moveToNextStep(currentIndex) {
  if (currentStep === currentIndex) {
    currentStep = Math.min(currentStep + 1, 4);
    updateStepIndicator();
  }
}

function updateStepIndicator() {
  for (let i = 0; i < 5; i++) {
    const stepElement = document.getElementById(`step${i + 1}`);
    if (stepElement) {
      if (i < currentStep) {
        stepElement.classList.remove('active');
        stepElement.classList.add('completed');
      } else if (i === currentStep) {
        stepElement.classList.add('active');
        stepElement.classList.remove('completed');
      } else {
        stepElement.classList.remove('active', 'completed');
      }
    }
  }
}

// إضافة مستمعي الأحداث للتبويبات
document.getElementById('form-tab').addEventListener('click', function () {
  currentStep = 0;
  updateStepIndicator();
});

if (!document.querySelector('[data-fa-processed]')) {
  const faScript = document.createElement('script');
  faScript.src =
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js';
  document.head.appendChild(faScript);
}
