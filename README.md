# 🎙️ Ni Tan Mal — Plataforma del Podcast

**Ni Tan Mal** es el sitio web oficial del podcast: un lugar donde la audiencia descubre el
show, se hace miembro, ve las transmisiones en vivo y accede a contenido exclusivo — y donde
el equipo detrás del podcast organiza todo su trabajo, desde la idea de un episodio hasta su
publicación.

En pocas palabras: **una cara pública para los fans y una trastienda de trabajo para el equipo**,
todo en el mismo sitio.

---

## 📌 ¿Qué resuelve?

Un podcast no es solo grabar y subir. Hay que:
- Atraer y fidelizar a la audiencia.
- Monetizar (publicidad, membresías).
- Coordinar a un equipo (guionistas, editores, invitados).
- Planificar y no perder ideas ni oportunidades.

Esta app junta todo eso en una sola plataforma, sin depender de mil herramientas sueltas.

---

## 👥 ¿Para quién es? (roles)

El sitio se comporta distinto según quién entra:

| Rol | Quién es | Qué puede hacer |
|-----|----------|-----------------|
| **Visitante / Miembro** | Cualquier persona con cuenta | Ver el show, episodios, horarios, en vivo, y hacerse **Premium** |
| **Miembro Premium** | Quien paga la membresía | Todo lo anterior + contenido y descargas exclusivas, sin anuncios |
| **Participante** | Integrante del equipo del podcast | Acceso a la **zona del equipo**: agenda, producción, notas, buzón |
| **Administrador** | Dueños / gestores del sitio | Control total: contenido, en vivo, usuarios y roles |

> El acceso es **con cuenta** (Google o correo/contraseña). El sitio primero muestra una
> pantalla de inicio de sesión; una vez dentro, cada quien ve lo que le corresponde.

---

## 🌐 La experiencia del público

Cuando alguien entra al sitio encuentra:

- **🔴 En vivo:** si el podcast está transmitiendo, aparece el reproductor de YouTube embebido
  directamente en la página (con chat al lado). Si no hay transmisión, muestra una **cuenta
  regresiva** al próximo show.
- **🎧 El show y sus formatos:** de qué trata el podcast, sus secciones y estilo.
- **📅 Horarios:** el calendario de próximos shows en vivo, con día, hora y tipo.
- **🎬 Episodios:** los más recientes en la portada y una página con **todos los episodios**,
  con enlaces directos a Spotify, YouTube y Apple Podcasts. Los episodios exclusivos van
  marcados con un 🥃.
- **📮 Buzón:** cualquiera puede enviar una **pregunta, idea o sugerencia de invitado** que el
  equipo lee y puede convertir en un episodio.
- **👤 Perfil:** cada usuario personaliza su cuenta con apodo, foto propia, país, región y teléfono.

---

## ⭐ Membresía Premium

El corazón de la monetización propia del sitio.

- Página **/premium** con el plan, precio y beneficios.
- **Beneficios:** episodios exclusivos, todas las descargas premium (audios, packs, guiones),
  sin anuncios, acceso anticipado e insignia de miembro.
- **Pago:** checkout con la estética de **MercadoPago** (hoy en modo demostración/simulado,
  listo para conectar el pago real).
- Una vez Premium, el contenido y las **descargas exclusivas** se desbloquean automáticamente
  (los que no son Premium ven un candado 🔒 con invitación a suscribirse).

> Además, el **en vivo se monetiza por YouTube** (anuncios, Super Chat, membresías del canal):
> el sitio suma espectadores al mismo stream sin fragmentar la audiencia.

---

## 🛠️ La trastienda: zona del equipo

Aquí es donde el podcast se organiza. Solo la ven **participantes** y **administradores**.

### 🎬 Pipeline de producción (lo más potente)
Cada episodio es una **card** que muestra en qué etapa va. Al entrar, se ve su desarrollo
completo a través de **6 etapas**:

**Idea → Guion → Grabación → Edición → Programado → Publicado**

En **cada etapa** se puede:
- Asignar un **responsable** (elegido del equipo) y una **fecha límite**.
- Definir su **estado**: Pendiente → En progreso → En revisión → **Aprobada** (aviso verde **LISTA**).
- Completar una **planilla de entrega tipada**: cada etapa tiene un formulario con **campos
  definidos** (texto, fecha, número, selección, enlace, casilla y **archivos**) — no texto libre —
  pensado según lo que necesita **la etapa siguiente** para continuar.
- Crear una **checklist de sub-tareas** (con plantillas típicas por etapa).
- Ver un aviso **ATRASADA** si la fecha venció y la etapa no está lista.

**Definición de Hecho (Definition of Done):** una etapa **no puede pasar a "Aprobada"** si le
faltan campos obligatorios de su planilla. Esta regla se **valida en el servidor**, así que el
contrato de entrega siempre se cumple. Además, cada **cambio de estado queda auditado** (quién,
qué y cuándo) en un historial visible por etapa.

Así cada encargado toma su etapa **viendo exactamente lo que dejó el anterior** en un formato
estructurado, y el trabajo fluye sin perderse en chats.

### 💼 Mi trabajo
Una vista personal (**"Mi trabajo"** en el menú) que reúne **todas las etapas asignadas a ti**
a través de **todos los episodios**, ordenadas por fecha límite y con aviso **ATRASADA** cuando
corresponde. Cada fila enlaza directo al episodio en su etapa. Así cada integrante ve de un
vistazo qué le toca, sin tener que abrir episodio por episodio.

### 📆 Agenda de reuniones
Calendario del mes con las reuniones del equipo: fecha, hora, lugar/enlace y notas.

### 💡 Notas e ideas
Un tablero para anotar ideas, invitados potenciales y temas, para que no se pierda ninguna
oportunidad.

### 📥 Buzón del público
Las preguntas y sugerencias que envía la audiencia llegan aquí para que el equipo las revise,
marque como respondidas o descarte.

---

## 🔔 Notificaciones

El equipo recibe **avisos in-app** (campanita en la barra superior):
- Cuando **te asignan** una etapa de un episodio.
- Cuando una etapa queda lista y **te toca la siguiente** (handoff automático).

Las notificaciones y los contenidos se **actualizan solos** (sin recargar la página).

---

## 🧑‍💼 Panel de administración

Solo para administradores. Organizado en pestañas:

- **En vivo:** activar/desactivar la transmisión y pegar el enlace de YouTube (con vista previa).
- **Shows:** crear los eventos/transmisiones y verlos en el calendario del mes (con opción premium).
- **Episodios:** crear, editar y borrar episodios con sus enlaces a plataformas.
- **Descargas:** subir archivos (de cualquier tipo) para la zona de miembros, marcarlos premium.
- **Usuarios:** ver a todos los registrados y asignarles rol (miembro, participante, admin).

---

## 🧩 ¿Cómo está construido? (visión general)

Sin entrar en tecnicismos, la app tiene dos partes:

- **La página (frontend):** lo que ves y usas. Rápida, moderna y responsiva (funciona en
  celular y computador), con un diseño oscuro "neón" propio del podcast.
- **El cerebro (backend en la nube):** guarda la información (usuarios, episodios, eventos,
  producción, etc.), maneja los archivos, valida los pagos y protege el contenido para que
  solo entren quienes corresponde.

Todo vive en la nube y se **actualiza solo** cada vez que se publica un cambio, sin
mantenimiento manual de servidores.

<details>
<summary>Detalle técnico (para quien le interese)</summary>

- **Frontend:** React + TypeScript + Vite + Chakra UI. Desplegado en **AWS Amplify Hosting**.
- **Autenticación:** Firebase Authentication (Google + correo/contraseña). El token del
  usuario se usa como credencial segura hacia el backend.
- **Backend:** AWS **API Gateway + Lambda** (Node.js) con validación del token por
  **JWT Authorizer**, datos en **DynamoDB** y archivos en **Amazon S3** (con enlaces firmados).
- **CI/CD:** el backend se despliega automáticamente con **GitHub Actions** (autenticación por
  OIDC, sin llaves permanentes).
- **Pagos:** integración con MercadoPago en modo simulado, preparada para el pago real.

</details>

---

## ▶️ Cómo ejecutarlo (para desarrollo)

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el sitio en local
npm run dev        # abre http://localhost:5173

# 3. Compilar para producción
npm run build
```

> La configuración pública (Firebase, URL del backend) va en el archivo `.env`.
> El backend (infraestructura en AWS) está en la carpeta `backend/`.

---

## 🗺️ Estado y próximos pasos

**Ya funciona:** login, perfiles, episodios, horarios, en vivo, membresía premium (demo),
descargas exclusivas, buzón, zona del equipo (producción, agenda, notas), notificaciones,
panel admin y despliegue automático.

**En la hoja de ruta:**
- Conectar el **pago real** de MercadoPago.
- **Notificaciones por correo** (además de las in-app).
- **CRM de invitados** y **biblioteca de assets** reutilizables.
- **Métricas** de audiencia y de la comunidad.

---

*Ni Tan Mal — el podcast de los hombres y las locuras que hacen antes de pensar.* 🥃
