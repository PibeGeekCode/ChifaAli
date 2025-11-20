// reservations.js - Sistema completo de reservas con gestión de mesas

// Configuración de mesas (capacidad)
const TABLES = [
  { id: 1, capacity: 2, name: 'Mesa 1' },
  { id: 2, capacity: 2, name: 'Mesa 2' },
  { id: 3, capacity: 4, name: 'Mesa 3' },
  { id: 4, capacity: 4, name: 'Mesa 4' },
  { id: 5, capacity: 4, name: 'Mesa 5' },
  { id: 6, capacity: 6, name: 'Mesa 6' },
  { id: 7, capacity: 6, name: 'Mesa 7' },
  { id: 8, capacity: 8, name: 'Mesa 8' },
  { id: 9, capacity: 10, name: 'Mesa 9' },
  { id: 10, capacity: 12, name: 'Mesa 10' }
];

// Obtener reservas del localStorage
function getReservations() {
  // Si hay configuración de Supabase, intentaremos obtener datos desde allí primero
  if (window.SUPABASE && window.supabaseClient) {
    // NOTE: esta llamada es síncrona en este helper para no romper llamadas actuales.
    // Para: compatibilidad simple, primero revisamos localStorage (cache) y devolvemos eso.
    return JSON.parse(localStorage.getItem('reservations') || '[]');
  }
  return JSON.parse(localStorage.getItem('reservations') || '[]');
}

// Guardar reservas en localStorage
function saveReservations(reservations) {
  localStorage.setItem('reservations', JSON.stringify(reservations));
  console.log('Saved to localStorage:', reservations.length, 'reservations');
  // NOTA: No sincronizamos con Supabase aquí porque ahora se hace directamente
  // en las operaciones específicas (insert, update, delete) para mejor control de errores
}

// --- Supabase helpers (opcional) ---
// Función para inicializar Supabase client
function initSupabaseClient() {
  if (!window.supabaseClient && window.SUPABASE) {
    try {
      // Initialize supabase client con la librería v2
      if (typeof supabase !== 'undefined' && supabase.createClient) {
        window.supabaseClient = supabase.createClient(window.SUPABASE.url, window.SUPABASE.anonKey);
        if (window.DEBUG) console.log('Supabase client initialized successfully');
      } else {
        if (window.DEBUG) console.warn('Supabase library not loaded. Make sure CDN script is included.');
      }
    } catch (e) {
      console.error('Supabase init failed:', e.message || e);
    }
  } else if (!window.SUPABASE) {
    if (window.DEBUG) console.warn('window.SUPABASE config not found. Check js/supabase-config.js');
  }
}

async function fetchReservationsFromSupabase() {
  if (!window.supabaseClient) return [];
  try {
    const { data, error } = await window.supabaseClient.from('reservations').select('*');
    if (error) throw error;
    if (window.DEBUG) console.log('Fetched from Supabase:', data?.length || 0, 'reservations');
    return data || [];
  } catch (err) {
    console.error('Fetch reservations from Supabase failed:', err.message || err);
    return [];
  }
}

async function upsertReservationToSupabase(reservation) {
  if (!window.supabaseClient) {
    if (window.DEBUG) console.warn('Supabase client not initialized, skipping upsert');
    return;
  }
  try {
    const payload = Object.assign({}, reservation, { dishes: reservation.dishes || [] });
    if (window.DEBUG) console.log('Upserting to Supabase:', payload.id);
    const { data, error } = await window.supabaseClient.from('reservations').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    if (window.DEBUG) console.log('Upsert successful for reservation:', payload.id);
    return data;
  } catch (err) {
    console.error('Upsert failed for reservation:', reservation.id, err.message || err);
    throw err;
  }
}

// Obtener platos reservados del sessionStorage
function getReservedDishes() {
  return JSON.parse(sessionStorage.getItem('reservedDishes') || '[]');
}

// Borrador de reserva (persistir datos entre páginas)
function getReservationDraft() {
  return JSON.parse(sessionStorage.getItem('reservationDraft') || '{}');
}

function saveReservationDraft(patch) {
  const current = getReservationDraft();
  sessionStorage.setItem('reservationDraft', JSON.stringify({ ...current, ...patch }));
}

function clearReservationDraft() {
  sessionStorage.removeItem('reservationDraft');
}

// Verificar disponibilidad de mesas para fecha/hora/cantidad de personas
async function getAvailableTables(date, time, guests) {
  // Obtener reservas actualizadas desde Supabase
  let reservations = [];
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient
        .from('reservations')
        .select('*')
        .eq('date', date)
        .eq('time', time)
        .neq('status', 'cancelled');
      if (error) throw error;
      reservations = data || [];
      console.log('Fetched reservations for availability check:', reservations.length);
    } catch (err) {
      console.error('Failed to fetch reservations from Supabase:', err.message || err);
      reservations = getReservations();
    }
  } else {
    reservations = getReservations();
  }
  
  const occupiedTableIds = reservations
    .filter(r => r.date === date && r.time === time && r.status !== 'cancelled')
    .map(r => r.tableId);
  
  return TABLES.filter(table => 
    !occupiedTableIds.includes(table.id) && table.capacity >= guests
  );
}

// Renderizar mesas disponibles
async function renderTables() {
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const guests = parseInt(document.getElementById('guests').value) || 1;
  const tableSelection = document.getElementById('tableSelection');
  
  if (!date || !time) {
    tableSelection.innerHTML = '<p class="info-text">Selecciona fecha y hora para ver mesas disponibles</p>';
    return;
  }
  
  const availableTables = await getAvailableTables(date, time, guests);
  
  if (availableTables.length === 0) {
    tableSelection.innerHTML = '<p class="info-text" style="color:#e74c3c">No hay mesas disponibles para esta fecha/hora/cantidad de personas</p>';
    return;
  }
  
  tableSelection.innerHTML = availableTables.map(table => `
    <div class="table-card available" data-table-id="${table.id}" data-capacity="${table.capacity}">
      <strong>${table.name}</strong>
      <span>Capacidad: ${table.capacity}</span>
    </div>
  `).join('');
  
  // Event listeners para selección de mesa
  document.querySelectorAll('.table-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.table-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      // Guardar mesa seleccionada en borrador
      saveReservationDraft({ selectedTableId: parseInt(card.dataset.tableId) });
    });
  });

  // Restaurar mesa seleccionada desde borrador (si aplica)
  const draft = getReservationDraft();
  if (draft.selectedTableId) {
    const selectedCard = document.querySelector(`.table-card[data-table-id="${draft.selectedTableId}"]`);
    if (selectedCard) selectedCard.classList.add('selected');
  }
}

// Renderizar platos seleccionados
function renderSelectedDishes() {
  const dishes = getReservedDishes();
  const container = document.getElementById('selectedDishes');
  
  if (dishes.length === 0) {
    container.innerHTML = '<p class="info-text">No has agregado platos aún</p>';
    return;
  }
  
  const total = dishes.reduce((sum, dish) => sum + (dish.price * dish.quantity), 0);
  
  container.innerHTML = dishes.map(dish => `
    <div class="dish-item">
      <span><strong>${dish.name}</strong> x${dish.quantity} - S/ ${(dish.price * dish.quantity).toFixed(2)}</span>
      <button onclick="removeDish('${dish.id}')">Eliminar</button>
    </div>
  `).join('') + `
    <div class="dish-item" style="background:#f8f9fa;font-weight:bold">
      <span>Total de platos:</span>
      <span>S/ ${total.toFixed(2)}</span>
    </div>
  `;
}

// Eliminar plato
function removeDish(dishId) {
  let dishes = getReservedDishes();
  dishes = dishes.filter(d => d.id !== dishId);
  sessionStorage.setItem('reservedDishes', JSON.stringify(dishes));
  renderSelectedDishes();
}

// Mostrar modal
function showModal(title, message, onClose) {
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  modal.style.display = 'block';
  
  const closeBtn = () => {
    modal.style.display = 'none';
    if (onClose) onClose();
    // limpiar listeners
    document.querySelectorAll('.close').forEach(btn => btn.removeEventListener('click', closeBtn));
    document.getElementById('modalBtn').removeEventListener('click', closeBtn);
    window.removeEventListener('click', outsideClickHandler);
  };

  const outsideClickHandler = (e) => { if (e.target === modal) closeBtn(); };

  document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', closeBtn));
  document.getElementById('modalBtn').addEventListener('click', closeBtn);
  window.addEventListener('click', outsideClickHandler);
}

// Procesar reserva
async function handleReservation(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const selectedTable = document.querySelector('.table-card.selected');
  
  if (!selectedTable) {
    showModal('Error', 'Por favor selecciona una mesa');
    return;
  }
  
  const reservation = {
    id: Date.now().toString(),
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email') || '',
    date: formData.get('date'),
    time: formData.get('time'),
    guests: parseInt(formData.get('guests')),
    tableId: parseInt(selectedTable.dataset.tableId),
    tableName: selectedTable.querySelector('strong').textContent,
    dishes: getReservedDishes(),
    notes: formData.get('notes') || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  // Primero guardar en Supabase
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from('reservations')
        .insert([reservation]);
      if (error) throw error;
      console.log('Reservation saved to Supabase:', reservation.id);
    } catch (err) {
      console.error('Failed to save reservation to Supabase:', err.message || err);
      showModal('Error', 'No se pudo guardar la reserva en la base de datos. Intenta nuevamente.');
      return;
    }
  } else {
    console.warn('Supabase not configured - saving only to localStorage');
  }
  
  // Luego actualizar localStorage
  const reservations = getReservations();
  reservations.push(reservation);
  saveReservations(reservations);
  
  // Construir mensaje de WhatsApp
  const dishesText = reservation.dishes.length > 0 
    ? '\n\n*Platos pre-ordenados:*\n' + reservation.dishes.map(d => `- ${d.name} x${d.quantity}`).join('\n')
    : '';
  
  const notesText = reservation.notes 
    ? `\n\n*Notas adicionales:* ${reservation.notes}`
    : '';
  
  const whatsappMessage = encodeURIComponent(
    `Hola, soy *${reservation.name}*.\n\n` +
    `Quisiera confirmar mi reserva:\n` +
    `📅 Fecha: ${reservation.date}\n` +
    `🕐 Hora: ${reservation.time}\n` +
    `👥 Personas: ${reservation.guests}\n` +
    `🪑 ${reservation.tableName}` +
    dishesText +
    notesText +
    `\n\n📱 Mi teléfono: ${reservation.phone}`
  );
  
  const restaurantPhone = '51993133289'; // Número del restaurante
  const whatsappUrl = `https://wa.me/${restaurantPhone}?text=${whatsappMessage}`;
  
  // Limpiar sessionStorage
  sessionStorage.removeItem('reservedDishes');
  clearReservationDraft();
  
  // Abrir WhatsApp automáticamente
  window.open(whatsappUrl, '_blank');
  
  // Limpiar sessionStorage y mostrar confirmación
  showModal(
    '✅ ¡Reserva Lista!',
    `Tu reserva para ${reservation.guests} persona(s) el ${reservation.date} a las ${reservation.time} ha sido registrada.\n\n` +
    `📱 Se ha abierto WhatsApp con tu mensaje de confirmación listo.\n\n` +
    `Solo presiona el botón "Enviar" para confirmar con el restaurante.`,
    () => {
      window.location.href = 'index.html';
    }
  );
}

// Establecer fecha mínima (hoy)
function setMinDate() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('date');
  dateInput.min = today;
  if (!dateInput.value) dateInput.value = today;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar cliente Supabase
  initSupabaseClient();
  
  setMinDate();

  // Cargar borrador de reserva (si existe)
  const loadDraftFields = () => {
    const draft = getReservationDraft();
    const ids = ['name','phone','email','date','time','guests','notes'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el && draft[id] !== undefined && draft[id] !== null && draft[id] !== '') {
        el.value = draft[id];
      }
    });
  };
  loadDraftFields();

  // Guardar cambios de campos en borrador
  ['name','phone','email','date','time','guests','notes'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      let val = el.value;
      if (id === 'guests') val = parseInt(val) || '';
      saveReservationDraft({ [id]: val });
      // Si cambian fecha/hora/invitados, volver a renderizar mesas
      if (id === 'date' || id === 'time' || id === 'guests') {
        renderTables();
      }
    });
  });
  renderSelectedDishes();
  
  // Event listeners
  document.getElementById('date').addEventListener('change', renderTables);
  document.getElementById('time').addEventListener('change', renderTables);
  document.getElementById('guests').addEventListener('input', renderTables);
  document.getElementById('reservationForm').addEventListener('submit', handleReservation);
  
  // Stepper
  const step1Pane = document.querySelector('.step-pane[data-step="1"]');
  const step2Panes = document.querySelectorAll('.step-pane[data-step="2"]');
  const stepIndicator1 = document.getElementById('stepIndicator1');
  const stepIndicator2 = document.getElementById('stepIndicator2');
  const nextBtn = document.getElementById('nextStep');
  const prevBtn = document.getElementById('prevStep');
  
  function goToStep(step){
    if (step === 1){
      step1Pane.classList.remove('hidden');
      step2Panes.forEach(p=>p.classList.add('hidden'));
      stepIndicator1.classList.add('active');
      stepIndicator2.classList.remove('active');
      saveReservationDraft({ currentStep: 1 });
    } else {
      step1Pane.classList.add('hidden');
      step2Panes.forEach(p=>p.classList.remove('hidden'));
      stepIndicator1.classList.remove('active');
      stepIndicator2.classList.add('active');
      saveReservationDraft({ currentStep: 2 });
      renderTables();
    }
  }
  if (nextBtn){
    nextBtn.addEventListener('click', () => {
      // Validar campos mínimos del paso 1
      const name = document.getElementById('name');
      const phone = document.getElementById('phone');
      if (!name.value.trim() || !phone.value.trim()){
        showModal('Datos incompletos', 'Ingresa tu nombre y teléfono para continuar');
        return;
      }
      // Guardar Paso 1 en borrador
      saveReservationDraft({
        name: name.value.trim(),
        phone: phone.value.trim(),
        email: document.getElementById('email')?.value?.trim() || ''
      });
      goToStep(2);
    });
  }
  if (prevBtn){
    prevBtn.addEventListener('click', () => goToStep(1));
  }
  // Arrancar en paso según borrador
  const initDraft = getReservationDraft();
  if (initDraft.currentStep === 2) {
    goToStep(2);
  } else {
    goToStep(1);
  }
  
  // Render inicial de tablas
  renderTables();
});

// Exponer removeDish globalmente
window.removeDish = removeDish;
