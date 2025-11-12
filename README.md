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
ChifaAli/
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
- Navegador web (Chrome, Firefox, Edge)
- Servidor web local (Python, Node.js, o extensión Live Server de VS Code)


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

## 🔗 Opcional: Sincronizar con Supabase (Paso rápido)

Si quieres que las reservas se persistan en una base de datos real puedes usar Supabase. La integración incluida en este repo es opcional y mantiene localStorage como fallback.

### Pasos para activar Supabase:

1. **Crea un proyecto en Supabase**
   - Ve a https://app.supabase.com y crea un nuevo proyecto
   - Copia tu Project URL y anon/public key

2. **Crea la tabla en Supabase**
   - Ve a SQL Editor en tu dashboard de Supabase
   - Ejecuta el script completo que está en `supabase-schema.sql`
   - Esto creará la tabla `reservations` con índices y políticas RLS básicas

3. **Configura las credenciales**
   - Ya tienes tu archivo `js/supabase-config.js` con tus credenciales
   - Los scripts de Supabase ya están incluidos en `reservas.html` y `admin.html`

4. **¡Listo!** 
   - Abre tu aplicación (con Live Server o Python HTTP server)
   - Las reservas se guardarán automáticamente tanto en localStorage como en Supabase
   - Revisa la consola del navegador (F12) para ver logs de sincronización

### ✅ Qué hace la integración:

- **Sincronización automática**: Cada vez que se crea, actualiza o elimina una reserva, se sincroniza con Supabase
- **Fallback local**: Si Supabase no está disponible, todo sigue funcionando con localStorage
- **Sin cambios en UX**: La experiencia del usuario no cambia, la sincronización es transparente

### ⚠️ Notas de seguridad:

La configuración actual usa políticas RLS muy permisivas (apropiadas para desarrollo/demo). 

**Para producción, deberías**:
- Implementar autenticación en Supabase (Auth)
- Restringir las políticas RLS para que solo usuarios autenticados puedan modificar/eliminar
- Mover operaciones administrativas sensibles a funciones Edge/Serverless con la service_role key
- NO exponer la service_role key en el cliente

### 🔍 Verificar que funciona:

1. Abre las DevTools (F12) → pestaña Console
2. Haz una reserva de prueba
3. Deberías ver: `Supabase upsert...` sin errores
4. Ve a Supabase → Table Editor → `reservations` y verifica que aparece el registro
