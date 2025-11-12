// admin.js - Panel de administración completo

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'chifa2025'
};

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

// Estado global
let currentFilters = { date: '', status: 'all' };
let selectedReservationId = null;

// --- Supabase client init (opcional) ---
function initSupabaseClient() {
  if (!window.supabaseClient && window.SUPABASE) {
    try {
      if (typeof supabase !== 'undefined' && supabase.createClient) {
        window.supabaseClient = supabase.createClient(window.SUPABASE.url, window.SUPABASE.anonKey);
        if (window.DEBUG) console.log('Supabase client initialized in admin');
      } else {
        if (window.DEBUG) console.warn('Supabase library not loaded in admin');
      }
    } catch (e) {
      console.error('Supabase init failed in admin:', e.message || e);
    }
  } else if (!window.SUPABASE) {
    if (window.DEBUG) console.warn('window.SUPABASE config not found in admin');
  }
}

// Obtener reservas
function getReservations() {
  return JSON.parse(localStorage.getItem('reservations') || '[]');
}

// Guardar reservas
function saveReservations(reservations) {
  localStorage.setItem('reservations', JSON.stringify(reservations));
  // Intentar sincronizar con Supabase en background si está configurado
  if (window.SUPABASE && window.supabaseClient) {
    try {
      reservations.forEach(r => {
        window.supabaseClient.from('reservations').upsert(r, { onConflict: 'id' }).catch(err => {
          console.warn('Supabase upsert failed (admin)', r.id, err.message || err);
        });
      });
    } catch (err) {
      console.warn('Supabase admin sync error', err.message || err);
    }
  }
}

// Verificar autenticación
function checkAuth() {
  const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
  if (isAuthenticated) {
    showAdminPanel();
  } else {
    showLoginScreen();
  }
}

// Mostrar login
function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
}

// Mostrar panel admin
function showAdminPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  loadDashboard();
}

// Manejar login
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('loginError');
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem('adminAuth', 'true');
    showAdminPanel();
  } else {
    errorMsg.textContent = 'Usuario o contraseña incorrectos';
    setTimeout(() => errorMsg.textContent = '', 3000);
  }
}

// Cerrar sesión
function handleLogout() {
  sessionStorage.removeItem('adminAuth');
  showLoginScreen();
}

// Cargar dashboard completo
function loadDashboard() {
  updateStats();
  renderTableMap();
  renderReservationsTable();
}

// Actualizar estadísticas
function updateStats() {
  const reservations = getReservations();
  const today = new Date().toISOString().split('T')[0];
  
  const todayReservations = reservations.filter(r => r.date === today && r.status !== 'cancelled');
  const occupiedTables = new Set(todayReservations.map(r => r.tableId)).size;
  
  document.getElementById('todayReservations').textContent = todayReservations.length;
  document.getElementById('totalReservations').textContent = reservations.length;
  document.getElementById('occupiedTables').textContent = `${occupiedTables} / ${TABLES.length}`;
}

// Renderizar mapa de mesas
function renderTableMap() {
  const reservations = getReservations();
  const today = new Date().toISOString().split('T')[0];
  const filterDate = currentFilters.date || today;
  
  const occupiedTableIds = reservations
    .filter(r => r.date === filterDate && r.status === 'confirmed')
    .map(r => r.tableId);
  
  const tableMap = document.getElementById('tableMap');
  tableMap.innerHTML = TABLES.map(table => {
    const isOccupied = occupiedTableIds.includes(table.id);
    const cssClass = isOccupied ? 'reserved' : 'free';
    const statusText = isOccupied ? 'Reservada' : 'Libre';
    
    return `
      <div class="table-map-item ${cssClass}">
        <strong>${table.name}</strong>
        <div style="font-size:0.85rem">${statusText}</div>
        <div style="font-size:0.75rem;color:#666">Cap: ${table.capacity}</div>
      </div>
    `;
  }).join('');
}

// Aplicar filtros
function applyFilters() {
  const dateFilter = document.getElementById('filterDate').value;
  const statusFilter = document.getElementById('filterStatus').value;
  
  currentFilters = { date: dateFilter, status: statusFilter };
  renderReservationsTable();
  renderTableMap();
}

// Limpiar filtros
function clearFilters() {
  document.getElementById('filterDate').value = '';
  document.getElementById('filterStatus').value = 'all';
  currentFilters = { date: '', status: 'all' };
  renderReservationsTable();
  renderTableMap();
}

// Renderizar tabla de reservas
function renderReservationsTable() {
  const reservations = getReservations();
  let filtered = reservations;
  
  // Aplicar filtros
  if (currentFilters.date) {
    filtered = filtered.filter(r => r.date === currentFilters.date);
  }
  if (currentFilters.status !== 'all') {
    filtered = filtered.filter(r => r.status === currentFilters.status);
  }
  
  // Ordenar por fecha/hora más reciente
  filtered.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });
  
  const tbody = document.getElementById('reservationsBody');
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:#666">No hay reservas que coincidan con los filtros</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(r => {
    const dishesCount = r.dishes?.length || 0;
    const dishesText = dishesCount > 0 ? `${dishesCount} plato(s)` : 'Ninguno';
    
    let statusClass = 'status-pending';
    let statusText = 'Pendiente';
    if (r.status === 'confirmed') {
      statusClass = 'status-confirmed';
      statusText = 'Confirmada';
    } else if (r.status === 'cancelled') {
      statusClass = 'status-cancelled';
      statusText = 'Cancelada';
    }
    
    return `
      <tr>
        <td>#${r.id.slice(-6)}</td>
        <td>${r.name}</td>
        <td>${r.date}</td>
        <td>${r.time}</td>
        <td>${r.guests}</td>
        <td>${r.tableName}</td>
        <td>${dishesText}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <div class="action-buttons">
            <button class="action-btn action-btn-view" onclick="viewReservation('${r.id}')">Ver</button>
            <button class="action-btn action-btn-delete" onclick="deleteReservation('${r.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Ver detalle de reserva
function viewReservation(id) {
  const reservations = getReservations();
  const reservation = reservations.find(r => r.id === id);
  
  if (!reservation) return;
  
  selectedReservationId = id;
  
  const dishesHTML = reservation.dishes?.length > 0
    ? reservation.dishes.map(d => `<li>${d.name} x${d.quantity} - S/ ${(d.price * d.quantity).toFixed(2)}</li>`).join('')
    : '<li>No hay platos pre-ordenados</li>';
  
  const totalDishes = reservation.dishes?.reduce((sum, d) => sum + (d.price * d.quantity), 0) || 0;
  
  const detailHTML = `
    <p><strong>ID:</strong> #${reservation.id.slice(-6)}</p>
    <p><strong>Cliente:</strong> ${reservation.name}</p>
    <p><strong>Teléfono:</strong> ${reservation.phone}</p>
    <p><strong>Email:</strong> ${reservation.email || 'No proporcionado'}</p>
    <p><strong>Fecha:</strong> ${reservation.date}</p>
    <p><strong>Hora:</strong> ${reservation.time}</p>
    <p><strong>Personas:</strong> ${reservation.guests}</p>
    <p><strong>Mesa:</strong> ${reservation.tableName}</p>
    <p><strong>Estado:</strong> ${getStatusText(reservation.status)}</p>
    <p><strong>Platos pre-ordenados:</strong></p>
    <ul style="margin-left:1.5rem">${dishesHTML}</ul>
    ${totalDishes > 0 ? `<p><strong>Total platos:</strong> S/ ${totalDishes.toFixed(2)}</p>` : ''}
    <p><strong>Notas:</strong> ${reservation.notes || 'Ninguna'}</p>
    <p style="font-size:0.85rem;color:#666"><strong>Creada:</strong> ${new Date(reservation.createdAt).toLocaleString('es-PE')}</p>
  `;
  
  document.getElementById('reservationDetail').innerHTML = detailHTML;
  document.getElementById('detailModal').style.display = 'block';
  
  // Actualizar botones según estado
  const confirmBtn = document.getElementById('confirmReservation');
  const cancelBtn = document.getElementById('cancelReservation');
  
  if (reservation.status === 'confirmed') {
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
  } else {
    confirmBtn.disabled = false;
    confirmBtn.style.opacity = '1';
  }
  
  if (reservation.status === 'cancelled') {
    cancelBtn.disabled = true;
    cancelBtn.style.opacity = '0.5';
  } else {
    cancelBtn.disabled = false;
    cancelBtn.style.opacity = '1';
  }
}

// Obtener texto de estado
function getStatusText(status) {
  const statusMap = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada'
  };
  return statusMap[status] || status;
}

// Confirmar reserva
function confirmReservation() {
  updateReservationStatus(selectedReservationId, 'confirmed');
}

// Cancelar reserva
function cancelReservation() {
  updateReservationStatus(selectedReservationId, 'cancelled');
}

// Actualizar estado de reserva
function updateReservationStatus(id, status) {
  const reservations = getReservations();
  const index = reservations.findIndex(r => r.id === id);
  
  if (index !== -1) {
    reservations[index].status = status;
    saveReservations(reservations);
    closeDetailModal();
    loadDashboard();
    // Si hay supabase, actualizar registro remoto
    if (window.supabaseClient) {
      window.supabaseClient.from('reservations').upsert(reservations[index], { onConflict: 'id' }).then(({ error }) => {
        if (error) console.warn('Supabase status update failed', error.message || error);
      }).catch(e => console.warn('Supabase error', e));
    }
  }
}

// Eliminar reserva
function deleteReservation(id) {
  if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;
  
  const reservations = getReservations();
  const filtered = reservations.filter(r => r.id !== id);
  saveReservations(filtered);
  loadDashboard();
  // También intentar borrar en Supabase (opcional)
  if (window.supabaseClient) {
    window.supabaseClient.from('reservations').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase delete failed', error.message || error);
    }).catch(e => console.warn('Supabase delete error', e));
  }
}

// Cerrar modal de detalle
function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
  selectedReservationId = null;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar cliente Supabase
  initSupabaseClient();
  
  checkAuth();
  
  // Event listeners
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('applyFilters').addEventListener('click', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
  document.getElementById('confirmReservation').addEventListener('click', confirmReservation);
  document.getElementById('cancelReservation').addEventListener('click', cancelReservation);
  document.getElementById('closeModal').addEventListener('click', closeDetailModal);
  
  // Cerrar modal al hacer clic en X o fuera
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', closeDetailModal);
  });
  
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('detailModal');
    if (e.target === modal) closeDetailModal();
  });
  
  // Establecer fecha de hoy en filtro
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filterDate').value = today;
});

// Exponer funciones globalmente
window.viewReservation = viewReservation;
window.deleteReservation = deleteReservation;
