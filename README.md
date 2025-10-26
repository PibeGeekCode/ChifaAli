# CHIFA ALI - Sistema de Reservas

Sistema completo de reservas para restaurante chifa, con gestión de mesas, pre-orden de platos y panel de administración.

## 🚀 Características

### Para Clientes
- **Landing Page Impactante**: 
  - Hero fullscreen con animación parallax y estadísticas animadas
  - Galería de platos destacados con efectos hover
  - Testimonios de clientes con slider automático
  - Secciones de llamado a la acción estratégicas
  - Diseño responsive premium con animaciones fluidas
- **Navegación completa**: Inicio, Menú, Reservas, Contacto
- **Sistema de reservas inteligente**: 
  - Selección de fecha, hora y número de personas
  - Asignación automática de mesas según capacidad
  - Pre-orden de platos desde el menú
  - Validación de disponibilidad en tiempo real
- **Menú interactivo**: Visualización de platos con precios y descripción
- **Carrito temporal**: Platos agregados se mantienen durante la sesión

### Para Administradores
- **Panel de administración protegido**: Login con credenciales
- **Dashboard con estadísticas**:
  - Reservas del día
  - Total de reservas
  - Mesas ocupadas vs disponibles
- **Mapa de mesas en tiempo real**: Visualización del estado de cada mesa
- **Gestión completa de reservas**:
  - Ver detalles completos (cliente, platos, notas)
  - Confirmar o cancelar reservas
  - Filtrar por fecha y estado
  - Eliminar reservas
- **Sistema de estados**: Pendiente, Confirmada, Cancelada

## 📁 Estructura del Proyecto

```
chifaali_clone/
├── index.html          # Landing page ultra impactante
├── menu.html           # Menú con platos
├── reservas.html       # Formulario de reservas
├── contacto.html       # Información de contacto
├── admin.html          # Panel de administración
├── css/
│   ├── styles.css      # Estilos principales
│   ├── landing.css     # Estilos de landing page
│   └── admin.css       # Estilos del panel admin
├── js/
│   ├── script.js       # Scripts generales
│   ├── landing.js      # Animaciones de landing (contadores, slider, parallax)
│   ├── menu.js         # Lógica del menú
│   ├── reservations.js # Sistema de reservas
│   └── admin.js        # Panel de administración
└── README.md
```

## 🔧 Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Edge)
- Servidor web local (Python, Node.js, o extensión Live Server de VS Code)

### Opción 1: Servidor Python (recomendado)

```powershell
cd chifaali_clone
python -m http.server 8000
```

Luego abre: http://localhost:8000

### Opción 2: Live Server en VS Code
1. Instala la extensión "Live Server"
2. Click derecho en `index.html` → "Open with Live Server"

### Opción 3: Node.js con http-server

```powershell
npm install -g http-server
cd chifaali_clone
http-server -p 8000
```

## 🔐 Credenciales de Administrador

- **Usuario**: `admin`
- **Contraseña**: `chifa2025`

Accede al panel en: http://localhost:8000/admin.html

## 💾 Almacenamiento de Datos

El sistema utiliza **localStorage** del navegador para persistir:
- Reservas completas (cliente, mesa, platos, estado)
- Historial de reservas

Y **sessionStorage** para:
- Autenticación del administrador
- Carrito temporal de platos durante la reserva

**Nota**: Los datos se mantienen localmente en el navegador. Para producción, considera implementar un backend (Node.js + MongoDB/PostgreSQL).

## 🗂️ Configuración de Mesas

El sistema incluye 10 mesas con diferentes capacidades:

| Mesa | Capacidad |
|------|-----------|
| 1-2  | 2 personas |
| 3-5  | 4 personas |
| 6-7  | 6 personas |
| 8    | 8 personas |
| 9    | 10 personas |
| 10   | 12 personas |

Las mesas se asignan automáticamente según:
1. Disponibilidad en fecha/hora seleccionada
2. Capacidad mínima para el número de personas

**CHIFA ALI** © 2025 · Sistema desarrollado con ❤️
