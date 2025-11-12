# Guía de Imágenes para CHIFA ALI

## Estructura de Carpetas

```
img/
├── platos/          # Platos principales y entradas
├── bebidas/         # Bebidas
├── postres/         # Postres
└── fallbacks/       # Imágenes de respaldo (NO MODIFICAR)
```

## Especificaciones Técnicas

### Tamaño Recomendado
- **Ancho:** 600-800px
- **Alto:** 400-500px
- **Relación:** 4:3 o 3:2 (horizontal)
- **Formato:** JPEG (.jpg) o WebP (.webp)
- **Peso:** 50-150 KB (optimizado)

### Calidad
- **Resolución:** 72-96 DPI (web)
- **Compresión JPEG:** 80-85%
- **Fondo:** Preferible plato completo, bien iluminado
- **Enfoque:** Nítido en el plato principal

## Nombres de Archivos (Sugeridos)

### Entradas
- `wantan-frito.jpg`
- `sopa-wantan.jpg`

### Platos Principales
- `arroz-chaufa.jpg`
- `tallarin-saltado.jpg`
- `aeropuerto.jpg`
- `pollo-tipakay.jpg`
- `chi-jau-kay.jpg`
- `chancho-agridulce.jpg`
- `kam-lu-wantan.jpg`
- `chaufa-mariscos.jpg`
- `lomo-saltado.jpg`
- `siu-mai.jpg`
- `tallarin-mariscos.jpg`
- `arroz-pollo-chijaukay.jpg`

### Postres
- `suspiro-limena.jpg`
- `flan.jpg`
- `gelatina.jpg`
- `pie-limon.jpg`
- `mazamorra-morada.jpg`

### Bebidas
- `chicha-morada.jpg`
- `inca-kola.jpg`
- `limonada.jpg`
- `te-durazno.jpg`
- `agua-mineral.jpg`
- `cerveza-cusquena.jpg`
- `jugo-maracuya.jpg`

## Herramientas de Optimización

### Online (Gratis)
- **TinyJPG/TinyPNG:** https://tinyjpg.com
- **Squoosh:** https://squoosh.app (Google)
- **Compressor.io:** https://compressor.io

### Escritorio
- **Windows:** RIOT, IrfanView
- **Mac:** ImageOptim
- **Multiplataforma:** GIMP (gratis), Photoshop

## Comandos Útiles (PowerShell)

### Redimensionar imágenes en lote (requiere ImageMagick)
```powershell
# Instalar ImageMagick primero: choco install imagemagick
Get-ChildItem *.jpg | ForEach-Object {
    magick $_.FullName -resize 600x400^ -gravity center -extent 600x400 -quality 85 "optimizado_$($_.Name)"
}
```

### Convertir a WebP (menor peso, mejor calidad)
```powershell
Get-ChildItem *.jpg | ForEach-Object {
    magick $_.FullName -quality 80 "$($_.BaseName).webp"
}
```

## Próximos Pasos

1. **Guarda tus fotos** en las carpetas correspondientes:
   - `img/platos/` → platos principales y entradas
   - `img/bebidas/` → bebidas
   - `img/postres/` → postres

2. **Optimiza** antes de subir (usa TinyJPG o similar)

3. **Actualiza** las rutas en `menu.html`:
   - Cambia `https://images.unsplash.com/...`
   - Por `img/platos/nombre-plato.jpg`

4. **Prueba** que las imágenes carguen correctamente

## Ejemplo de Actualización en menu.html

**Antes:**
```html
<img src="https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop" alt="Arroz Chaufa">
```

**Después:**
```html
<img src="img/platos/arroz-chaufa.jpg" alt="Arroz Chaufa">
```

## Notas Importantes

- **NO elimines** la carpeta `img/fallbacks/` (contiene food.svg y drink.svg de respaldo)
- Las imágenes se cargan con `loading="lazy"` (carga diferida automática)
- Si una imagen falla, se muestra automáticamente el SVG de respaldo
- Nombres de archivo: usa minúsculas, guiones (no espacios ni acentos)

---

**¿Necesitas ayuda?** Avísame cuando tengas las imágenes listas y actualizo automáticamente las rutas en menu.html
