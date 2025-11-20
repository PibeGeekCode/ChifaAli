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
let currentFilters = { date: '', status: 'all', released: 'all' };
let selectedReservationId = null;

// --- Supabase client init (opcional) ---
function initSupabaseClient() {
  if (!window.supabaseClient && window.SUPABASE) {
    try {
      if (typeof supabase !== 'undefined' && supabase.createClient) {
        window.supabaseClient = supabase.createClient(window.SUPABASE.url, window.SUPABASE.anonKey);
        console.log('Supabase client initialized in admin');
      } else {
        console.warn('Supabase library not loaded in admin');
      }
    } catch (e) {
      console.error('Supabase init failed in admin:', e.message || e);
    }
  } else if (!window.SUPABASE) {
    console.warn('window.SUPABASE config not found in admin');
  }
}

// Obtener reservas desde Supabase (sincronizadas) o localStorage como fallback
async function fetchReservations() {
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient.from('reservations').select('*').order('createdAt', { ascending: false });
      if (error) throw error;
      console.log('Fetched from Supabase:', data?.length || 0, 'reservations');
      // Guardar en localStorage como cache
      if (data) {
        localStorage.setItem('reservations', JSON.stringify(data));
      }
      return data || [];
    } catch (err) {
      console.error('Fetch reservations from Supabase failed:', err.message || err);
      console.warn('Falling back to localStorage');
      return JSON.parse(localStorage.getItem('reservations') || '[]');
    }
  }
  // Si no hay Supabase, usar localStorage
  return JSON.parse(localStorage.getItem('reservations') || '[]');
}

// Obtener reservas síncronas (desde localStorage)
function getReservations() {
  return JSON.parse(localStorage.getItem('reservations') || '[]');
}

// Guardar reservas
function saveReservations(reservations) {
  localStorage.setItem('reservations', JSON.stringify(reservations));
  // NOTA: No sincronizamos con Supabase aquí porque se hace directamente
  // en las operaciones específicas (insert, update, delete) para mejor control de errores
}

// Verificar autenticación
async function checkAuth() {
  const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
  if (isAuthenticated) {
    await showAdminPanel();
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
async function showAdminPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  await loadDashboard();
}

// Manejar login
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('loginError');
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    sessionStorage.setItem('adminAuth', 'true');
    await showAdminPanel();
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
async function loadDashboard() {
  // Primero obtener datos desde Supabase
  await fetchReservations();
  // Luego actualizar la UI
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
  // Ocupación en tiempo real considerando ventana de 3 horas desde inicio o hasta liberación
  const NOW_MINUTES = (() => { const d=new Date(); return d.getHours()*60+d.getMinutes(); })();
  function timeToMinutes(t){ const [hh,mm]=t.split(':').map(Number); return hh*60+mm; }
  const occupiedTableIds = reservations.filter(r => {
      if (r.date !== filterDate) return false;
      if (r.status !== 'confirmed') return false;
      if (r.active === false || r.releasedAt) return false;
      const start = timeToMinutes(r.time);
      return NOW_MINUTES >= start && NOW_MINUTES < (start + 180); // dentro de la ventana de uso
    }).map(r => r.tableId);
  
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
async function applyFilters() {
  const dateFilter = document.getElementById('filterDate').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const releasedFilter = document.getElementById('filterReleased').value;
  
  currentFilters = { date: dateFilter, status: statusFilter, released: releasedFilter };
  await fetchReservations(); // Refrescar datos antes de filtrar
  renderReservationsTable();
  renderTableMap();
}

// Limpiar filtros
async function clearFilters() {
  document.getElementById('filterDate').value = '';
  document.getElementById('filterStatus').value = 'all';
  document.getElementById('filterReleased').value = 'all';
  currentFilters = { date: '', status: 'all', released: 'all' };
  await fetchReservations(); // Refrescar datos
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
  if (currentFilters.released === 'active') {
    filtered = filtered.filter(r => r.status === 'confirmed' && !r.releasedAt);
  } else if (currentFilters.released === 'released') {
    filtered = filtered.filter(r => r.releasedAt);
  }
  
  // Ordenar por fecha/hora más reciente
  filtered.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });
  
  const tbody = document.getElementById('reservationsBody');
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:2rem;color:#666">No hay reservas que coincidan con los filtros</td></tr>';
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
    
    // Estado de atención
    let attentionBadge = '<span style="color:#999;font-size:0.85rem">-</span>';
    if (r.status === 'confirmed' && r.releasedAt) {
      const releasedDate = new Date(r.releasedAt).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit' });
      attentionBadge = `<span class="status-badge" style="background:#28a745;color:#fff">✓ Atendida<br><small style="font-size:0.75rem">${releasedDate}</small></span>`;
    } else if (r.status === 'confirmed' && !r.releasedAt) {
      attentionBadge = '<span class="status-badge" style="background:#ffc107;color:#333">⏳ Activa</span>';
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
        <td>${attentionBadge}</td>
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
    ${reservation.releasedAt ? `<p style="font-size:0.85rem;color:#28a745;font-weight:bold"><strong>✓ Mesa liberada:</strong> ${new Date(reservation.releasedAt).toLocaleString('es-PE')}</p>` : ''}
    ${reservation.status === 'cancelled' && reservation.cancellationReason ? `<p style="font-size:0.9rem;color:#dc3545;background:#fff3cd;padding:0.5rem;border-left:3px solid #dc3545;margin-top:0.5rem"><strong>❌ Cancelada:</strong> ${new Date(reservation.cancelledAt || reservation.createdAt).toLocaleString('es-PE')}<br><strong>Motivo:</strong> ${reservation.cancellationReason}</p>` : ''}
  `;
  
  document.getElementById('reservationDetail').innerHTML = detailHTML;
  document.getElementById('detailModal').style.display = 'block';
  
  // Actualizar botones según estado
  const confirmBtn = document.getElementById('confirmReservation');
  const cancelBtn = document.getElementById('cancelReservation');
  const releaseBtn = document.getElementById('releaseReservation');
  
  // Deshabilitar confirmar si ya está confirmada O cancelada
  if (reservation.status === 'confirmed' || reservation.status === 'cancelled') {
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
  } else {
    confirmBtn.disabled = false;
    confirmBtn.style.opacity = '1';
  }
  
  // Mostrar liberar solo si está confirmada y no liberada
  if (reservation.status === 'confirmed' && !reservation.releasedAt) {
    releaseBtn.style.display = 'inline-block';
    releaseBtn.disabled = false;
  } else {
    releaseBtn.style.display = 'none';
  }
  
  // Deshabilitar cancelar si ya está cancelada O si fue liberada (atendida)
  if (reservation.status === 'cancelled' || reservation.releasedAt) {
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
async function cancelReservation() {
  if (!selectedReservationId) return;
  
  const reservations = getReservations();
  const reservation = reservations.find(r => r.id === selectedReservationId);
  
  if (!reservation) return;
  
  // Confirmar cancelación
  const reason = prompt('¿Por qué motivo se cancela esta reserva?\n(El cliente recibirá esta información por WhatsApp)');
  
  if (reason === null) return; // Usuario canceló el prompt
  
  const cancellationReason = reason.trim() || 'No especificado';
  
  // Construir mensaje de WhatsApp
  const mensaje = encodeURIComponent(
    `Hola ${reservation.name},\n\n` +
    `Lamentamos informarte que tu reserva ha sido cancelada:\n\n` +
    `📅 Fecha: ${reservation.date}\n` +
    `🕐 Hora: ${reservation.time}\n` +
    `👥 Personas: ${reservation.guests}\n` +
    `🪑 ${reservation.tableName}\n\n` +
    `*Motivo:* ${cancellationReason}\n\n` +
    `Disculpa las molestias. Puedes hacer una nueva reserva en otro horario.\n\n` +
    `Saludos,\nCHIFA ALI`
  );
  
  const whatsappUrl = `https://wa.me/51${reservation.phone}?text=${mensaje}`;
  
  // Abrir WhatsApp
  window.open(whatsappUrl, '_blank');
  
  // Actualizar estado con motivo de cancelación
  const index = reservations.findIndex(r => r.id === selectedReservationId);
  if (index !== -1) {
    reservations[index].status = 'cancelled';
    reservations[index].cancellationReason = cancellationReason;
    reservations[index].cancelledAt = new Date().toISOString();
    
    // Actualizar en Supabase
    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient
          .from('reservations')
          .update({ 
            status: 'cancelled',
            cancellationReason: cancellationReason,
            cancelledAt: reservations[index].cancelledAt
          })
          .eq('id', selectedReservationId);
        if (error) throw error;
        console.log('Cancellation reason saved to Supabase');
      } catch (e) {
        console.error('Supabase update failed', e.message || e);
      }
    }
    
    // Actualizar localStorage
    saveReservations(reservations);
    closeDetailModal();
    await loadDashboard();
  }
}

// Actualizar estado de reserva
async function updateReservationStatus(id, status) {
  const reservations = getReservations();
  const index = reservations.findIndex(r => r.id === id);
  
  if (index !== -1) {
    reservations[index].status = status;
    if (status === 'confirmed') {
      reservations[index].active = true; // activar ocupación
    }
    
    // Primero actualizar en Supabase
    if (window.supabaseClient) {
      try {
        const updatePayload = { status: status };
        if (status === 'confirmed') updatePayload.active = true;
        const { error } = await window.supabaseClient
          .from('reservations')
          .update(updatePayload)
          .eq('id', id);
        if (error) throw error;
        console.log('Status updated in Supabase for reservation:', id);
      } catch (e) {
        console.error('Supabase status update failed', e.message || e);
        alert('Error al actualizar en la base de datos: ' + (e.message || e));
        return;
      }
    }
    
    // Luego actualizar localStorage
    saveReservations(reservations);
    closeDetailModal();
    await loadDashboard();
  }
}

// Liberar mesa (terminó el uso real) de una reserva confirmada
async function releaseReservation() {
  if (!selectedReservationId) return;
  const reservations = getReservations();
  const index = reservations.findIndex(r => r.id === selectedReservationId);
  if (index === -1) return;
  if (reservations[index].status !== 'confirmed') return;
  reservations[index].active = false;
  reservations[index].releasedAt = new Date().toISOString();
  saveReservations(reservations);
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from('reservations')
        .update({ active: false, releasedAt: reservations[index].releasedAt })
        .eq('id', selectedReservationId);
      if (error) console.warn('Supabase release failed', error.message || error);
    } catch (e) {
      console.warn('Supabase release error', e.message || e);
    }
  }
  closeDetailModal();
  await loadDashboard();
}

// Eliminar reserva
async function deleteReservation(id) {
  if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;
  
  // Primero eliminar de Supabase
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from('reservations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      console.log('Reservation deleted from Supabase:', id);
    } catch (e) {
      console.error('Supabase delete failed', e.message || e);
      alert('Error al eliminar de la base de datos: ' + (e.message || e));
      return;
    }
  }
  
  // Luego actualizar localStorage
  const reservations = getReservations();
  const filtered = reservations.filter(r => r.id !== id);
  saveReservations(filtered);
  await loadDashboard();
}

// Cerrar modal de detalle
function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
  selectedReservationId = null;
}

// Mostrar modal de estadísticas
function showStatsModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('statsDate').value = today;
  document.getElementById('statsModal').style.display = 'block';
  renderStats(today);
}

// Cerrar modal de estadísticas
function closeStatsModal() {
  document.getElementById('statsModal').style.display = 'none';
}

// Renderizar estadísticas
function renderStats(date) {
  const reservations = getReservations();
  const filtered = reservations.filter(r => r.date === date);
  
  // Contar por estados
  const pending = filtered.filter(r => r.status === 'pending').length;
  const confirmed = filtered.filter(r => r.status === 'confirmed').length;
  const cancelled = filtered.filter(r => r.status === 'cancelled').length;
  const released = filtered.filter(r => r.releasedAt).length;
  const active = filtered.filter(r => r.status === 'confirmed' && !r.releasedAt).length;
  
  // Total de personas
  const totalGuests = filtered.reduce((sum, r) => r.status !== 'cancelled' ? sum + r.guests : sum, 0);
  
  // Platos pre-ordenados
  const totalDishes = filtered.reduce((sum, r) => {
    if (r.status !== 'cancelled' && r.dishes) {
      return sum + r.dishes.reduce((s, d) => s + d.quantity, 0);
    }
    return sum;
  }, 0);
  
  const totalRevenue = filtered.reduce((sum, r) => {
    if (r.status !== 'cancelled' && r.dishes) {
      return sum + r.dishes.reduce((s, d) => s + (d.price * d.quantity), 0);
    }
    return sum;
  }, 0);
  
  // Calcular porcentajes para barras
  const total = filtered.length || 1;
  const pendingPct = (pending / total * 100).toFixed(1);
  const confirmedPct = (confirmed / total * 100).toFixed(1);
  const cancelledPct = (cancelled / total * 100).toFixed(1);
  const releasedPct = (released / total * 100).toFixed(1);
  const activePct = (active / total * 100).toFixed(1);
  
  const statsHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:2rem">
      <div class="stat-card" style="background:#fff3cd">
        <h3>⏳ Pendientes</h3>
        <p class="stat-value">${pending}</p>
      </div>
      <div class="stat-card" style="background:#d1ecf1">
        <h3>✅ Confirmadas</h3>
        <p class="stat-value">${confirmed}</p>
      </div>
      <div class="stat-card" style="background:#f8d7da">
        <h3>❌ Canceladas</h3>
        <p class="stat-value">${cancelled}</p>
      </div>
      <div class="stat-card" style="background:#d4edda">
        <h3>✓ Atendidas</h3>
        <p class="stat-value">${released}</p>
      </div>
      <div class="stat-card" style="background:#ffc107">
        <h3>⏱ Activas</h3>
        <p class="stat-value">${active}</p>
      </div>
    </div>
    
    <div style="background:#f8f9fa;padding:1.5rem;border-radius:8px;margin-bottom:1.5rem">
      <h4 style="margin-top:0">Distribución de Estados</h4>
      <div style="margin:1rem 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">
          <span>Pendientes</span><span>${pending} (${pendingPct}%)</span>
        </div>
        <div style="background:#e0e0e0;height:20px;border-radius:10px;overflow:hidden">
          <div style="background:#ffc107;height:100%;width:${pendingPct}%"></div>
        </div>
      </div>
      <div style="margin:1rem 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">
          <span>Confirmadas</span><span>${confirmed} (${confirmedPct}%)</span>
        </div>
        <div style="background:#e0e0e0;height:20px;border-radius:10px;overflow:hidden">
          <div style="background:#17a2b8;height:100%;width:${confirmedPct}%"></div>
        </div>
      </div>
      <div style="margin:1rem 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">
          <span>Canceladas</span><span>${cancelled} (${cancelledPct}%)</span>
        </div>
        <div style="background:#e0e0e0;height:20px;border-radius:10px;overflow:hidden">
          <div style="background:#dc3545;height:100%;width:${cancelledPct}%"></div>
        </div>
      </div>
      <div style="margin:1rem 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">
          <span>Atendidas</span><span>${released} (${releasedPct}%)</span>
        </div>
        <div style="background:#e0e0e0;height:20px;border-radius:10px;overflow:hidden">
          <div style="background:#28a745;height:100%;width:${releasedPct}%"></div>
        </div>
      </div>
      <div style="margin:1rem 0">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">
          <span>Activas (no atendidas)</span><span>${active} (${activePct}%)</span>
        </div>
        <div style="background:#e0e0e0;height:20px;border-radius:10px;overflow:hidden">
          <div style="background:#fd7e14;height:100%;width:${activePct}%"></div>
        </div>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem">
      <div style="background:#fff;padding:1rem;border-radius:8px;border:1px solid #ddd">
        <h4 style="margin-top:0;color:#666">👥 Total Personas</h4>
        <p style="font-size:2rem;font-weight:bold;margin:0;color:#333">${totalGuests}</p>
      </div>
      <div style="background:#fff;padding:1rem;border-radius:8px;border:1px solid #ddd">
        <h4 style="margin-top:0;color:#666">🍽 Platos Pre-ordenados</h4>
        <p style="font-size:2rem;font-weight:bold;margin:0;color:#333">${totalDishes}</p>
      </div>
      <div style="background:#fff;padding:1rem;border-radius:8px;border:1px solid #ddd">
        <h4 style="margin-top:0;color:#666">💰 Ingresos Platos</h4>
        <p style="font-size:2rem;font-weight:bold;margin:0;color:#28a745">S/ ${totalRevenue.toFixed(2)}</p>
      </div>
      <div style="background:#fff;padding:1rem;border-radius:8px;border:1px solid #ddd">
        <h4 style="margin-top:0;color:#666">📋 Total Reservas</h4>
        <p style="font-size:2rem;font-weight:bold;margin:0;color:#333">${filtered.length}</p>
      </div>
    </div>
    
    ${filtered.length === 0 ? '<p style="text-align:center;color:#999;margin-top:2rem">No hay reservas para esta fecha</p>' : ''}
  `;
  
  document.getElementById('statsContent').innerHTML = statsHTML;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar cliente Supabase
  initSupabaseClient();
  
  checkAuth();
  
  // Event listeners
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Actualizando...';
    await loadDashboard();
    btn.disabled = false;
    btn.textContent = '🔄 Actualizar';
  });
  document.getElementById('applyFilters').addEventListener('click', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
  document.getElementById('confirmReservation').addEventListener('click', confirmReservation);
  document.getElementById('cancelReservation').addEventListener('click', cancelReservation);
  document.getElementById('releaseReservation').addEventListener('click', releaseReservation);
  document.getElementById('closeModal').addEventListener('click', closeDetailModal);
  
  // Modal de estadísticas
  document.getElementById('statsCard').addEventListener('click', showStatsModal);
  document.getElementById('closeStatsModal').addEventListener('click', closeStatsModal);
  document.getElementById('updateStats').addEventListener('click', () => {
    const date = document.getElementById('statsDate').value;
    if (date) renderStats(date);
  });
  
  // Cerrar modal al hacer clic en X o fuera
  document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', closeDetailModal);
  });
  
  window.addEventListener('click', (e) => {
    const modal = document.getElementById('detailModal');
    const statsModal = document.getElementById('statsModal');
    if (e.target === modal) closeDetailModal();
    if (e.target === statsModal) closeStatsModal();
  });
  
  // Establecer fecha de hoy en filtro
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('filterDate').value = today;
});

// Exponer funciones globalmente
window.viewReservation = viewReservation;
window.deleteReservation = deleteReservation;
window.releaseReservation = releaseReservation;
