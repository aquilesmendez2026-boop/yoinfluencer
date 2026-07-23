# 📰 Yo Influencer — Medio editorial del mundo swinger

**Yo Influencer** es un **periódico digital del ambiente swinger**: un medio editorial escrito por
un **staff de creadores** (los *influencers*), organizado en **secciones temáticas** como cualquier
publicación seria — Vida Swinger, Shibari, Bondage, BDSM, Spanking, Arte Erótico, Clubs y Eventos.

En pocas palabras: **cada creador publica artículos en su(s) sección(es), el público los lee, y
detrás hay una redacción con roles, permisos y una trastienda de trabajo** — todo en el mismo sitio,
detrás de un aviso de contenido para **mayores de 18 años**.

> Este proyecto nació como la plataforma del podcast *Ni Tan Mal*, pasó por una etapa de "creador
> de contenido" y hoy es un **medio editorial**. Quedan huellas de esa historia en el código, y
> están documentadas a propósito (ver la nota sobre `/episodios` y la nota de despliegue sobre las
> tablas `nitalmal-*`). No son bugs: son deuda técnica conocida.

---

## 🔞 Antes de entrar: el aviso +18

El sitio trata sexualidad adulta, ambiente swinger y prácticas como BDSM, shibari y arte erótico,
con fines informativos y de comunidad. Por eso **lo primero que ve cualquier visitante es un aviso
de contenido para adultos** (`src/organisms/AgeGate.tsx`), incluso **antes del login**.

- Al confirmar "Tengo +18", se guarda una marca en **`localStorage`** (`yi_age_ok`) para no volver
  a preguntar en ese dispositivo. Quien elige "Soy menor / salir" es redirigido fuera del sitio.
- El aviso vive **por fuera** del `AuthProvider`: bloquea todo el sitio antes de que exista sesión.

> ⚠️ **No es una verificación de identidad real.** Es una declaración del usuario guardada en el
> navegador; no comprueba edad ni identidad. Si en algún momento hace falta verificación real, es
> una pieza aparte.

---

## 📌 ¿Qué resuelve?

Sostener un medio con varias plumas no es solo escribir. Hay que:
- Organizar el contenido por **secciones** temáticas, como un periódico.
- Coordinar a un **staff** de creadores con distintos niveles de responsabilidad.
- Decidir **quién puede publicar y dónde** (no todo el mundo escribe en todas las secciones).
- Dar a cada creador una **cara pública** (su página de autor) y al medio un **directorio** de firmas.
- Monetizar (membresía Premium), recibir mensajes del público y avisar al equipo de lo que pasa.

Esta app junta todo eso en una sola plataforma, sin depender de mil herramientas sueltas.

---

## 👥 La redacción: roles y jerarquía

El sitio se comporta distinto según quién entra. Los roles forman una **jerarquía**: a mayor rango,
más permisos, e **incluye** los del rango inferior.

**`miembro` → `influencer` → `editor` → `admin` → `super_admin`**

| Rol | Quién es | Qué puede hacer |
|-----|----------|-----------------|
| **miembro** | Cualquier persona con cuenta | **Leer** artículos publicados, ver el directorio de creadores, lugares, agenda, hacerse **Premium** y escribir al **buzón** |
| **influencer** | Creador del staff | Todo lo anterior + **publicar y editar sus propios artículos**, pero **solo en las secciones que un admin le asignó**. Tiene página pública de autor. Accede a la **trastienda** del equipo |
| **editor** | Editor del medio | Publica/edita en **cualquier sección**, edita y borra artículos de otros (modera el contenido) |
| **admin** | Gestión del medio | Gestiona **secciones**, **usuarios y roles**, asigna secciones a influencers, y controla lo del sitio (en vivo, redes, historial de lives, descargas, eventos) |
| **super_admin** | Dueño del medio | **Control total. Es único** |

> El acceso es **con cuenta** (Google o correo/contraseña, vía Firebase). El sitio primero muestra
> el aviso +18, después el login; una vez dentro, cada quien ve lo que le corresponde.

La jerarquía vive en `backend/src/index.mjs` (`ROLES` + `rankOf`/`atLeast`) y se refleja en el
frontend en `src/services/team.ts` y `src/providers/AuthProvider.tsx`. El frontend esconde botones,
pero **quien manda es el servidor**: cada ruta valida el rango antes de responder.

### 🛡️ Reglas de seguridad de los roles

Están concentradas en `PUT /usuarios/{id}/role` y en el bootstrap de `GET /me`:

- **`super_admin` no se asigna por API.** Se fija **una sola vez** en el arranque en frío: cuando un
  usuario se crea (y solo al crearse, con `if_not_exists`), si su email coincide con la variable
  **`ADMIN_EMAIL`**, su rol inicial es `super_admin`. Así se resuelve el problema del huevo y la
  gallina (con la tabla de usuarios vacía, nadie podría promover a nadie). No sirve para reescalar
  una cuenta que ya existe.
- **Nadie puede degradar al `super_admin`.** Cambiar el rol de una cuenta `super_admin` está
  bloqueado.
- **Solo se otorgan roles de rango estrictamente menor al propio.** Un admin puede nombrar editores
  e influencers, pero no otro admin ni un super_admin. Esto evita la escalada de privilegios.

---

## 🖋️ El modelo editorial (el corazón del producto)

### Secciones

Una **sección** es una temática del medio, como las secciones de un periódico. Tiene nombre, `slug`,
descripción, color, orden y una marca **`activa`**. El público solo ve las activas; un admin ve todas.
Las gestionan **admins** (`/secciones`, servicio `src/services/secciones.ts`).

Secciones típicas del medio: **Vida Swinger, Shibari, Bondage, BDSM, Spanking, Arte Erótico,
Clubs y Eventos** (se crean desde el panel; no están cableadas en el código).

### Artículos

Cada **artículo** pertenece a **una sección** y tiene **un autor** (un influencer del staff). Lleva
título, resumen, cuerpo (texto largo), portada opcional (imagen en S3 con URL firmada) y enlaces a
redes.

**Estado `borrador` | `publicado` — publicación directa, sin flujo de aprobación.** Un influencer
publica cuando quiere; no hay revisión previa por parte de un editor.

**Visibilidad (la resuelve el backend en `GET /episodios`):**

| Quién mira | Qué ve |
|------------|--------|
| Público / miembro | **Solo artículos publicados** |
| El propio autor (influencer) | Los publicados + **sus propios borradores** |
| `editor` y superiores | **Todo** (publicados y borradores de cualquiera) |

**Permiso de publicación por sección** (`puedeEnSeccion` en el backend):

- Un **influencer** solo puede crear/editar artículos en las secciones que un admin le asignó con
  **`PUT /usuarios/{id}/secciones`** (servicio `setUsuarioSecciones`).
- Un **editor o superior** puede publicar/editar en **cualquier** sección.
- **Editar/borrar** un artículo lo puede hacer **su autor** o un **editor+**.

Servicio del frontend: `src/services/contenidos.ts` (tipos `Contenido`, `ContenidoInput`).

### Páginas de autor y directorio

- **Directorio `/influencers`**: la lista de firmas del medio (todos los del staff, `influencer` o
  superior), ordenada por rango.
- **Página pública `/influencer/:id`**: la cara de cada creador — su alias, **bio**, **secciones** en
  las que escribe y **sus artículos**.

Ambas se sirven desde `/influencers` y `/influencers/{id}` en el backend (servicio
`src/services/influencers.ts`). El perfil del creador (alias, bio, foto) se edita en su propia cuenta
(`src/services/profile.ts`, campos `alias` y `bio`).

---

## 🌐 La experiencia del público

Cuando alguien entra (ya con sesión y el +18 confirmado) encuentra:

- **📰 Artículos** por sección, con portada, autor y resumen. Los premium van marcados.
- **✍️ Creadores:** el directorio del staff y la página de cada autor.
- **📍 Clubs y lugares del ambiente:** el catálogo de locales visitados/reseñados (ver más abajo).
- **🔴 En vivo:** si el medio está transmitiendo, se enciende el reproductor embebido en la home.
- **📅 Agenda:** el calendario de eventos.
- **📮 Buzón:** cualquiera puede enviar una pregunta o sugerencia que el staff lee.
- **👤 Perfil:** cada usuario personaliza su cuenta (apodo, foto, país, región, teléfono; y, si es
  staff, su **alias** y **bio** de autor).

Rutas del frontend: `/` (home), `/contenidos`, `/lugares`, `/agenda`, `/miembros`, `/premium`,
`/checkout`, `/cuenta`, `/configuracion`, `/mi-trabajo`, `/admin`, `/login`. Las páginas públicas de
autor y sección (`InfluencerPage`, `InfluencersPage`, `SeccionPage`, `ArticuloPage`, `MiPaginaPage`)
ya existen como componentes.

---

## 📍 Clubs y lugares del ambiente

Recontextualizado del pivote anterior: el catálogo de "lugares visitados" ahora describe **locales
del ambiente**. Cada ficha tiene nombre, **categoría**, fotos (hasta 12, en S3 con URL firmada),
rating de 1 a 5, rango de precio, reseña, dirección, ciudad, link a Maps, fecha de visita, marca de
recomendado y un enlace al artículo relacionado.

**Categorías** (`CATEGORIAS_LUGAR` en el backend; `src/services/lugares.ts`):

`club` · `sauna` · `hotel` · `bar` · `evento` · `fiesta_privada` · `tienda` · `taller` · `otro`

**Publicación controlada:** cada ficha tiene una marca `publicado`. El público solo ve las
publicadas; el staff ve **todas**, incluidos los borradores (`GET /lugares` filtra según el rol). Se
cargan y editan desde la trastienda (staff) y se ven en **`/lugares`**. Al borrar un lugar también se
borran sus fotos en S3, para no dejar archivos huérfanos.

---

## ⭐ Membresía Premium

La monetización propia del sitio.

- Página **`/premium`** con el plan, precio y beneficios; checkout con la estética de **MercadoPago**.
- **Pago simulado (mock).** Hoy `POST /suscripcion/pagar` marca la cuenta como premium al instante;
  la estructura está lista para reemplazar el mock por el SDK real (la `preferencia` y el webhook de
  confirmación). Ver el bloque de `SUSCRIPCIÓN` en `backend/src/index.mjs`.
- Una vez Premium, el contenido y las **descargas exclusivas** se desbloquean automáticamente.

> El staff (influencer o superior) cuenta como premium sin pagar (`isPremium` en `AuthProvider`).

---

## 🛠️ La trastienda: zona del equipo

Solo la ven **influencer y superiores** (en el código, `canParticipate` = ser parte del staff).

- **📥 Buzón del público:** las preguntas y sugerencias que llega el equipo revisa, marca como
  respondidas o descarta.
- **💡 Notas e ideas** y **📆 agenda de reuniones** del equipo.
- **🎬 Pipeline de producción** (`/produccion`, vista personal en **`/mi-trabajo`**): un flujo de
  trabajo con etapas tipadas (**Idea → Guion → Grabación → Edición → Programado → Publicado**),
  planillas por etapa, responsables, fechas límite, checklist de sub-tareas, "Definición de Hecho"
  validada en el servidor e historial auditado. Es la herramienta de producción del staff y convive
  con la publicación editorial directa.

---

## 🔔 Notificaciones

El staff recibe **avisos in-app** (campanita en la barra superior): cuando **te asignan** una etapa
de producción y cuando una etapa queda lista y **te toca la siguiente** (handoff automático). Las
notificaciones se **actualizan solas**, sin recargar la página.

---

## 🧑‍💼 Panel de administración

En `/admin`, organizado por pestañas. La columna "Quién puede" indica el rango mínimo.

| Pestaña | Para qué sirve | Rango mínimo |
|---------|----------------|--------------|
| **Secciones** | Crear/editar/ordenar/activar las secciones temáticas | admin |
| **Usuarios** | Ver registrados, asignar **rol** y **secciones** a cada influencer | admin |
| **En vivo** | Activar/desactivar la transmisión y pegar el enlace | admin |
| **Eventos** | Crear los eventos de la agenda | admin |
| **Redes** | Editar los perfiles sociales, handles, seguidores y orden | admin |
| **En vivos** | Registrar el historial de directos realizados | admin |
| **Descargas** | Subir archivos para la zona de miembros y marcarlos premium | admin |
| **Clubs / Lugares** | Cargar y publicar locales del ambiente | influencer / staff |
| **Artículos** | Escribir y publicar (cada quien en sus secciones) | influencer / staff |

---

## 🏷️ Trampas de nombres (lo que confunde al que retoma)

Hay huellas del pasado en el **wire** (las rutas y claves del API) que **no coinciden con el dominio
actual**. Están así a propósito; renombrarlas obliga a migrar datos y coordinar front + back.

### "Artículo" en el producto, `/episodios` en el API

**El dominio se llama "artículo"** en toda la app nueva (los tipos `Contenido`/`ContenidoInput`, el
servicio `src/services/contenidos.ts`, la UI). **Pero las rutas HTTP siguen siendo `/episodios`** y
las respuestas usan las claves `episodios` / `episodio`:

```
GET    /episodios        → listar artículos       (responde { episodios: [...] })
POST   /episodios        → crear artículo          (responde { episodio: {...} })
PUT    /episodios/{id}   → editar artículo
DELETE /episodios/{id}   → borrar artículo
POST   /episodios-upload → subir la portada a S3
```

La tabla en DynamoDB también se llama **`yoinfluencer-episodios`**. El servicio `contenidos.ts`
traduce el nombre viejo al nuevo y lleva un comentario que lo advierte. **No renombres el wire sin
migrar el backend y los datos.**

### `/live` (singular) ≠ `/lives` (plural)

Dos cosas distintas, fácil de confundir:

- **`/live`** — el estado del sitio: ¿hay transmisión **ahora**? Un interruptor con el ID del video y
  el título. Es lo que enciende el reproductor en la home. Solo admin lo cambia.
- **`/lives`** — el **historial** de directos ya realizados (título, fecha, plataforma, duración,
  espectadores, enlace, descripción). Solo admin lo administra.

### Lugares → clubs del ambiente

El módulo de "lugares" se **recontextualizó** a locales del ambiente swinger (categorías `club`,
`sauna`, `hotel`, `bar`, `evento`, `fiesta_privada`, `tienda`, `taller`, `otro`), pero las rutas
siguen siendo `/lugares`.

---

## 🎨 Identidad visual

Diseño oscuro **verde y negro**, sobrio. La escala de marca va del `#ecfdf3` al `#054f31`, con
`brand.500` (`#12b76a`) como color de acción y `brand.400` (`#32d583`) como acento sobre fondo
oscuro. Los negros llevan un tinte verde muy leve para el fondo del canvas.

> **No es un diseño "neón".** Las sombras de marca son halos contenidos, no glow. Si agregas
> componentes, respeta esa sobriedad y usa los tokens semánticos (`bg.canvas`, `fg.muted`,
> `border.subtle`, `brand.primary`) en vez de colores literales.

---

## 🧩 ¿Cómo está construido? (visión general)

Dos partes:

- **La página (frontend):** lo que ves y usas. Rápida, moderna y responsiva.
- **El cerebro (backend en la nube):** guarda la información, maneja los archivos, valida los roles y
  protege el contenido para que solo entre quien corresponde.

<details>
<summary>Detalle técnico (para quien le interese)</summary>

- **Frontend:** **React 19 + TypeScript + Vite + Chakra UI v3**. Autenticación con **Firebase Auth**
  (Google + correo/contraseña); el ID token del usuario viaja como bearer hacia el backend.
- **Backend:** **AWS SAM** (`backend/template.yaml`) define **API Gateway (HTTP API) + Lambda**
  (Node.js 22, arm64) con **JWT Authorizer** de Firebase, datos en **DynamoDB** y archivos en **S3**
  (con URLs firmadas). Todo el handler vive en `backend/src/index.mjs`.
- **Pagos:** MercadoPago en modo simulado, preparado para el real.

**Tablas DynamoDB** — todas con prefijo **`yoinfluencer-`**: `usuarios`, `secciones` *(nueva)*,
`episodios` *(los artículos)*, `eventos`, `reuniones`, `notas`, `descargas`, `preguntas`,
`produccion`, `notificaciones`, `lugares`, `redes`, `lives`, `config`.

**Buckets S3:** `yoinfluencer-avatars-<cuenta>` (fotos de perfil) y
`yoinfluencer-archivos-<cuenta>` (descargas, portadas de artículos, fotos de lugares, adjuntos de
producción).

</details>

---

## ▶️ Cómo ejecutarlo en local

Son **dos procesos**: el frontend (Vite) y el backend (un servidor local que corre el handler real
contra las tablas reales de AWS).

### 1. Backend (API local)

```bash
cd backend
npm install
npm run dev        # levanta http://localhost:8787
```

Esto corre **`backend/local-server.mjs`**: un servidor de desarrollo que **reemplaza a API Gateway** y
ejecuta el handler real (`src/index.mjs`) contra las **tablas y buckets reales** de DynamoDB/S3 en
**`us-east-2`**, cuenta **`970335222766`**. Necesita **credenciales de AWS** en el entorno (las del
usuario IAM **`nitamal-deployer`**).

> ⚠️ **Diferencia con producción:** el servidor local **decodifica** el ID token de Firebase pero
> **no verifica su firma** (en producción eso lo hace el JWT Authorizer de API Gateway). Es solo para
> desarrollo; **nunca lo expongas a internet**. Puedes definir `ADMIN_EMAIL` para el bootstrap del
> super admin.

### 2. Frontend

```bash
npm install
npm run dev        # abre http://localhost:5173
```

Configura el `.env` (copia `.env.example`): la config pública de **Firebase** y la URL del backend
**`VITE_API_URL=http://localhost:8787`**.

```bash
npm run build      # compilar para producción
```

---

## 🚀 Infraestructura y despliegue

`backend/template.yaml` (AWS SAM) es la definición del **API Gateway + Lambda** y de las tablas y
buckets. En la práctica, **las tablas `yoinfluencer-*` de esta cuenta se crearon directamente por
CLI** (con el IAM de **`nitamal-deployer`**), no necesariamente a través del stack. La región es
**`us-east-2`** y la cuenta **`970335222766`**. La tabla **`yoinfluencer-secciones`** es la más
reciente (llegó con el modelo editorial).

Para desplegar el API con SAM:

```bash
cd backend
sam build
sam deploy
```

Tras un despliegue nuevo, toma el output **`ApiUrl`** del stack y actualízalo en **`VITE_API_URL`**
(entorno del frontend), luego reconstruye el frontend.

### ⚠️ Las tablas `nitalmal-*` NO se usan

Del pasado del proyecto quedan tablas con prefijo **`nitalmal-*`** en la cuenta. **Ningún código las
lee ni las escribe** — todo apunta a `yoinfluencer-*`. Si ves datos "que faltan" en la app, no es un
bug del código: probablemente estén en las tablas viejas y **nunca se migraron**. No las borres a la
ligera sin exportarlas antes.

---

## 🗺️ Estado y próximos pasos

**Ya funciona:** aviso +18, login, perfiles y páginas de autor, jerarquía de 5 roles con reglas de
seguridad, secciones editoriales, artículos con publicación directa y visibilidad por rol, asignación
de secciones a influencers, directorio de creadores, clubs/lugares, en vivo e historial de lives,
agenda, membresía premium (mock), descargas exclusivas, buzón, trastienda del equipo (producción,
notas, reuniones), notificaciones y panel admin.

**En la hoja de ruta:**
- Renombrar el wire `/episodios` → `/articulos` (con migración de datos).
- Conectar el **pago real** de MercadoPago.
- **Notificaciones por correo** además de las in-app.
- Verificación de edad más robusta que el aviso en `localStorage`.
- Migrar o dar de baja lo que quede en las tablas `nitalmal-*`.

---

*Yo Influencer — un medio del ambiente, escrito por quienes lo viven. Solo +18.* 🔞
