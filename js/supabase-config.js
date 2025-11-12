// supabase-config.example.js
// Copia este archivo como `supabase-config.js` y pon tus credenciales de Supabase.
// NO subas la versión con tu `anonKey` a un repositorio público si contiene datos sensibles.

window.SUPABASE = {
  // URL de tu proyecto Supabase (ej: https://xyzabcd.supabase.co)
  url: 'https://nnxphiludthsvgwybvgx.supabase.co',
  // Public anon key (para operaciones públicas). Para acciones administrativas usa una función server-side.
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ueHBoaWx1ZHRoc3Znd3lidmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDc4NjYsImV4cCI6MjA3ODQ4Mzg2Nn0.0tFCAvzM1JX9KUELpt60EqkjYleD4Clv8-0L88I5l8E'
};

/*
Instrucciones rápidas:
1) Incluye la librería y este archivo en las páginas que necesiten sincronizar:

   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.min.js"></script>
   <script src="js/supabase-config.js"></script>

2) Reinicia la aplicación. El cliente intentará sincronizar reservas con Supabase en segundo plano.

Notas de seguridad:
- Para operaciones administrativas (confirmar/cancelar/eliminar) deberías usar RLS y Auth en Supabase o una endpoint server-side
  con la llave de servicio. Este ejemplo usa la clave anónima para INSERT/SELECT si la provees, y es una integración orientada a pruebas.
*/
