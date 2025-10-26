// menu.js - Gestión del menú y agregado de platos a reservas

// Obtener platos reservados del sessionStorage
function getReservedDishes() {
  return JSON.parse(sessionStorage.getItem('reservedDishes') || '[]');
}

// Guardar platos en sessionStorage
function saveReservedDishes(dishes) {
  sessionStorage.setItem('reservedDishes', JSON.stringify(dishes));
}

// Agregar plato a la reserva
function addDishToReservation(dishId, dishName, price) {
  const dishes = getReservedDishes();
  const existingDish = dishes.find(d => d.id === dishId);
  
  if (existingDish) {
    existingDish.quantity++;
  } else {
    dishes.push({ id: dishId, name: dishName, price: parseFloat(price), quantity: 1 });
  }
  
  saveReservedDishes(dishes);
  showNotification(`${dishName} agregado a tu reserva`);
}

// Mostrar notificación
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position:fixed;
    top:80px;
    right:20px;
    background:#27ae60;
    color:#fff;
    padding:1rem 1.5rem;
    border-radius:4px;
    box-shadow:0 4px 12px rgba(0,0,0,.2);
    z-index:1000;
    animation:slideIn 0.3s ease;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const addButtons = document.querySelectorAll('.add-to-reservation');
  const searchInput = document.getElementById('menuSearch');
  const orderCount = document.getElementById('orderCount');
  const orderWidget = document.getElementById('orderWidget');
  
  // Lazy loading + fallbacks
  const menuImages = document.querySelectorAll('.menu-item img');
  menuImages.forEach(img => {
    img.setAttribute('loading','lazy');
    img.addEventListener('error', () => {
      const isDrink = img.closest('#bebidas') !== null;
      img.src = isDrink ? 'img/fallbacks/drink.svg' : 'img/fallbacks/food.svg';
    }, { once: true });
  });
  
  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const menuItem = e.target.closest('.menu-item');
      const id = menuItem.dataset.id;
      const name = menuItem.dataset.name;
      const price = menuItem.dataset.price;
      
      addDishToReservation(id, name, price);
      updateOrderWidget();
    });
  });

  // Búsqueda en vivo
  if (searchInput) {
    const allItems = Array.from(document.querySelectorAll('.menu-item'));
    const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
    let debounce;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounce);
      const q = normalize(e.target.value.trim());
      debounce = setTimeout(() => {
        allItems.forEach(item => {
          const name = normalize(item.dataset.name || item.querySelector('h4')?.textContent || '');
          item.style.display = q === '' || name.includes(q) ? '' : 'none';
        });
      }, 120);
    });
  }

  // Inicializar widget
  function updateOrderWidget(){
    const dishes = getReservedDishes();
    const count = dishes.reduce((acc,d)=>acc + (d.quantity||1), 0);
    if (orderCount) orderCount.textContent = count;
    if (orderWidget) orderWidget.style.display = count > 0 ? 'flex' : 'none';
  }
  updateOrderWidget();
});

// Agregar animaciones CSS dinámicamente
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
