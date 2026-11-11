# GUÍA DE DESPLIEGUE: GOOGLE APPS SCRIPT PARA «EL DIARIO DEL AULA 1.º B»

Esta guía explica paso a paso cómo conectar la hoja de cálculo oficial de Google Sheets con la aplicación web «El Diario del Aula – 1.º B» mediante un **Google Apps Script Web App** en modo de solo lectura.

---

## 1. ARQUITECTURA DE PRIVACIDAD Y SEGURIDAD

- **Tu Hoja de Google Sheets permanece 100 % privada y restringida**: Solo tú (el tutor Manuel Herrera) tienes acceso de edición. Las familias nunca acceden al archivo ni necesitan cuenta de Google.
- **Google Apps Script actúa como servidor intermediario (proxy seguro)**:
  - Lee los datos de la hoja privada ejecutándose con tus permisos.
  - Filtra estrictamente los registros: **solo se envían los datos con estado `PUBLICAR`**.
  - Los borradores (`BORRADOR`) y los elementos archivados (`ARCHIVADO`) nunca salen del servidor de Google.
  - Sirve los datos en formato JSON y JSONP (eliminando cualquier error de CORS o redirecciones en Netlify y dispositivos móviles).
- **Cero costes de mantenimiento**: Funciona dentro de la cuota gratuita de Google Workspace y Netlify.

---

## 2. PASO A PASO: INSTALACIÓN EN GOOGLE APPS SCRIPT

### Paso 1: Abrir el editor de Google Apps Script
1. Abre tu hoja de cálculo oficial en Google Sheets:
   - **ID de la hoja**: `1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1`
2. En el menú superior de Google Sheets, haz clic en **Extensiones** > **Apps Script**.
   *(También puedes crearlo desde [script.google.com](https://script.google.com) si prefieres un script independiente).*

### Paso 2: Pegar el código del intermediario
1. En el editor de Apps Script, elimina cualquier código que aparezca por defecto en el archivo `Código.gs`.
2. Abre el archivo `google-apps-script/Code.gs` (o `Code.gs` en la raíz de este proyecto) y **copia todo su contenido**.
3. Pégalo en el editor de Google Apps Script.
4. En la parte superior, ponle de nombre al proyecto: `El Diario del Aula - API 1.º B`.
5. Haz clic en el icono del **disco (Guardar)** o pulsa `Ctrl + S` (`Cmd + S` en Mac).

### Paso 3: Publicar como Aplicación Web (Web App)
1. En la esquina superior derecha del editor de Apps Script, haz clic en el botón azul **Implementar** (o *Deploy*) > **Nueva implementación**.
2. En el panel lateral izquierdo, pulsa el engranaje ⚙️ junto a *Seleccionar tipo* y elige **Aplicación web**.
3. Configura los siguientes campos **exactamente** como se indica:
   - **Descripción**: `Versión 1.0 - API lectura familias 1.º B`
   - **Ejecutar como**: `Yo (<tu_correo>@...)` *(imprescindible: así el script lee tu hoja privada sin pedir cuenta a las familias)*.
   - **Quién tiene acceso**: `Cualquier persona` (o *Anyone, even anonymous*).
4. Haz clic en **Implementar**.
5. Si es la primera vez, Google te solicitará **Autorizar el acceso**:
   - Haz clic en *Revisar permisos*.
   - Elige tu cuenta de Google.
   - Si aparece la pantalla "Google no ha verificado esta app", haz clic en *Configuración avanzada* y luego en *Ir a El Diario del Aula - API 1.º B (no seguro)*.
   - Haz clic en *Permitir*.
6. Al finalizar, Google te mostrará una ventana con la **URL de la aplicación web**. Tendrá un formato similar a:
   ```text
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXXXX/exec
   ```
7. Haz clic en **Copiar** para guardar esa URL.

---

## 3. CONECTAR LA URL CON LA APLICACIÓN

Tienes dos opciones muy sencillas para activar la URL en la aplicación:

### Opción A (Recomendada para Netlify / Producción):
1. Entra en tu panel de control de **Netlify**.
2. Ve a **Site configuration** > **Environment variables**.
3. Haz clic en **Add a variable** e introduce:
   - **Key**: `VITE_APPS_SCRIPT_URL`
   - **Value**: Pega la URL de tu Web App que copiaste en el Paso 3.
4. **IMPORTANTE**: Las variables `VITE_` se empaquetan en el código durante la compilación (`npm run build`). Una vez guardada la variable, ve a la pestaña **Deploys** de Netlify, pulsa en **Trigger deploy** y selecciona **Clear cache and deploy site**. ¡Listo!

### Opción B (Directa en el código):
1. Abre el archivo `src/config/appsScriptConfig.ts`.
2. Pega tu URL en la función o variable correspondiente:
   ```typescript
   export const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```

---

## 4. ESTRUCTURA DE LAS 9 PESTAÑAS OFICIALES EN GOOGLE SHEETS

Asegúrate de que tu hoja de cálculo contenga exactamente estas 9 pestañas con sus columnas correspondientes:

| Pestaña | Columnas oficiales | Función pedagógica |
| :--- | :--- | :--- |
| **LEEME** | `SECCION`, `INSTRUCCIONES` | Guía de uso interna para el profesor (la app la ignora). |
| **CONFIGURACION** | `clave`, `valor`, `descripcion` | Nombre del colegio, curso escolar, mensaje de bienvenida y URLs protegidas. |
| **DIA_A_DIA** | `id`, `fecha`, `titulo`, `contenido`, `categoria`, `imagen_url`, `enlace_url`, `destacado`, `estado`, `orden` | Publicaciones diarias del aula, tareas y actividades. |
| **AVISOS** | `id`, `fecha_publicacion`, `fecha_limite`, `titulo`, `mensaje`, `tipo`, `prioridad`, `enlace_url`, `destacado`, `estado`, `orden` | Tablón oficial de avisos y circulares importantes para las familias. |
| **CALENDARIO** | `id`, `fecha_inicio`, `fecha_fin`, `hora_inicio`, `hora_fin`, `titulo`, `descripcion`, `categoria`, `lugar`, `destacado`, `estado`, `orden` | Salidas escolares, excursiones, días festivos y reuniones. |
| **HORARIO** | `dia_semana`, `orden_sesion`, `hora_inicio`, `hora_fin`, `asignatura`, `observaciones` | Distribución semanal de lunes a viernes. |
| **MULTIMEDIA** | `id`, `fecha`, `titulo`, `descripcion`, `tipo`, `url_media`, `miniatura_url`, `actividad_relacionada`, `estado`, `orden` | Fotos del aula y vídeos educativos (YouTube nocookie privado). |
| **APRENDEMOS** | `id`, `categoria`, `titulo`, `descripcion`, `tipo_recurso`, `url_recurso`, `imagen_url`, `nivel`, `estado`, `orden` | Qué trabajamos en clase (Lengua Castellana y Matemáticas de 1.º B). |
| **RECURSOS** | `id`, `categoria`, `titulo`, `descripcion`, `tipo_recurso`, `url_recurso`, `imagen_url`, `asignatura`, `nivel`, `estado`, `orden`, `destacado` | Biblioteca para casa (Fichas PDF descargables, juegos de lógica y pautas familiares). |

---

## 5. REGLAS DE PUBLICACIÓN PARA EL PROFESOR

- **Para que un registro aparezca en la aplicación de las familias**:
  - En la columna `estado`, escribe **`PUBLICAR`** (en mayúsculas).
- **Para preparar material con antelación**:
  - Escribe **`BORRADOR`**. La aplicación nunca lo mostrará.
- **Para retirar un aviso o actividad antigua sin borrarla**:
  - Escribe **`ARCHIVADO`**. Se mantendrá en tu hoja de cálculo para tus registros pero desaparecerá de la app familiar.
- **Destacados**:
  - En la columna `destacado`, escribe **`SI`** para que aparezca resaltado con estrella en la pantalla de inicio y cabeceras.

---

## 6. PROBAR QUE EL SERVIDOR FUNCIONA

Una vez desplegada la aplicación web de Apps Script, puedes comprobarla directamente abriendo tu navegador e introduciendo:

```text
https://script.google.com/macros/s/AKfycb.../exec?action=ping
```
Debe devolver:
```json
{
  "status": "ok",
  "app": "El Diario del Aula 1.º B",
  "spreadsheetId": "1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1",
  "timestamp": "..."
}
```

Y para comprobar todos los datos que verán las familias:
```text
https://script.google.com/macros/s/AKfycb.../exec?action=all
```
Recibirás un objeto JSON optimizado con todas las pestañas procesadas y filtradas en milisegundos.
