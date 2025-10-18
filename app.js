// ---------- Configuración (edítalas si quieres) ----------
const adminEmails = ["admin1@correo.com", "admin2@correo.com", "admin3@correo.com"];
const adminPassword = "12345";

// ---------- Selectores ----------
const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const userSection = document.getElementById("userSection");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const btnSolicitudes = document.getElementById("btnSolicitudes");
const btnSeguimiento = document.getElementById("btnSeguimiento");
const logoutAdmin = document.getElementById("logoutAdmin");
const logoutUser = document.getElementById("logoutUser");

const solicitudesPanel = document.getElementById("solicitudesPanel");
const seguimientoPanel = document.getElementById("seguimientoPanel");
const solicitudesList = document.getElementById("solicitudesList");
const seguimientoList = document.getElementById("seguimientoList");
const resumenMes = document.getElementById("resumenMes");
const backFromSolicitudes = document.getElementById("backFromSolicitudes");
const backFromSeguimiento = document.getElementById("backFromSeguimiento");

const userBadge = document.getElementById("userBadge");
const userRequestsList = document.getElementById("userRequestsList");

const solicitarBtns = () => document.querySelectorAll(".solicitarBtn");

// ---------- Estado (se guardará en localStorage) ----------
let solicitudes = JSON.parse(localStorage.getItem("demo_solicitudes") || "[]");
let prestamos = JSON.parse(localStorage.getItem("demo_prestamos") || "[]");
let usuarioActual = null; // email

// ---------- helpers para persistencia ----------
function saveState(){
  localStorage.setItem("demo_solicitudes", JSON.stringify(solicitudes));
  localStorage.setItem("demo_prestamos", JSON.stringify(prestamos));
}

// ---------- mostrar/ocultar secciones ----------
function showSection(sectionId){
  [loginSection, adminSection, userSection].forEach(s => s.classList.add("hidden"));
  if(sectionId === "login") loginSection.classList.remove("hidden");
  if(sectionId === "admin") adminSection.classList.remove("hidden");
  if(sectionId === "user") userSection.classList.remove("hidden");
}

// ---------- Login ----------
loginBtn.addEventListener("click", () => {
  loginError.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if(!email || !password){ loginError.textContent = "Completa ambos campos"; return; }

  if(adminEmails.includes(email) && password === adminPassword){
    showSection("admin");
    // al entrar admin mostramos panel principal (esconde subpanels)
    solicitudesPanel.classList.add("hidden");
    seguimientoPanel.classList.add("hidden");
    document.querySelector(".panel").classList.remove("hidden");
    actualizarSolicitudesList();
    actualizarSeguimientoList();
  } else {
    // usuario normal: aceptamos cualquier correo/contraseña no vacío
    usuarioActual = email;
    userBadge.textContent = usuarioActual;
    renderUserRequests();
    showSection("user");
  }

  // limpiar campos
  emailInput.value = "";
  passwordInput.value = "";
});

// ---------- Logout ----------
logoutAdmin.addEventListener("click", () => {
  showSection("login");
});
logoutUser.addEventListener("click", () => {
  usuarioActual = null;
  userBadge.textContent = "";
  showSection("login");
});

// ---------- Marketplace -> solicitar ----------
function attachSolicitarListeners(){
  solicitarBtns().forEach(btn => {
    // eliminar listeners previos (por si se vuelve a llamar)
    btn.replaceWith(btn.cloneNode(true));
  });
  // re-query
  document.querySelectorAll(".solicitarBtn").forEach(b => {
    b.addEventListener("click", (e) => {
      if(!usuarioActual){
        alert("Primero inicia sesión como usuario (no admin).");
        return;
      }
      const item = e.currentTarget.dataset.item;
      // pedimos días por prompt (puedes cambiar por modal)
      const diasStr = prompt("¿Cuántos días quieres el préstamo? (ej. 7)", "7");
      const dias = parseInt(diasStr);
      if(!dias || dias <= 0){ alert("Días inválidos"); return; }

      const fechaSolicitud = new Date();
      const fechaEntrega = new Date();
      fechaEntrega.setDate(fechaEntrega.getDate() + dias);

      const nuevaSolicitud = {
        id: Date.now() + Math.floor(Math.random()*999),
        usuario: usuarioActual,
        item,
        dias,
        fechaSolicitud: fechaSolicitud.toISOString(),
        fechaEntrega: fechaEntrega.toISOString(),
        estado: "pendiente"
      };
      solicitudes.push(nuevaSolicitud);
      saveState();
      alert("Solicitud enviada: " + item);
      renderUserRequests();
    });
  });
}

// ---------- Render usuario: mis solicitudes ----------
function renderUserRequests(){
  userRequestsList.innerHTML = "";
  const mis = solicitudes.filter(s => s.usuario === usuarioActual);
  if(mis.length === 0) {
    userRequestsList.innerHTML = "<li class='list-empty'>No tienes solicitudes</li>";
    return;
  }
  mis.forEach(s => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `<strong>${s.item}</strong> — ${new Date(s.fechaSolicitud).toLocaleDateString()} — Estado: ${s.estado}`;
    userRequestsList.appendChild(li);
  });
}

// ---------- Admin: mostrar subpanel solicitudes ----------
btnSolicitudes.addEventListener("click", () => {
  document.querySelector(".panel").classList.add("hidden");
  solicitudesPanel.classList.remove("hidden");
  seguimientoPanel.classList.add("hidden");
  actualizarSolicitudesList();
});
backFromSolicitudes.addEventListener("click", () => {
  solicitudesPanel.classList.add("hidden");
  document.querySelector(".panel").classList.remove("hidden");
});

// ---------- Admin: mostrar subpanel seguimiento ----------
btnSeguimiento.addEventListener("click", () => {
  document.querySelector(".panel").classList.add("hidden");
  seguimientoPanel.classList.remove("hidden");
  solicitudesPanel.classList.add("hidden");
  actualizarSeguimientoList();
});
backFromSeguimiento.addEventListener("click", () => {
  seguimientoPanel.classList.add("hidden");
  document.querySelector(".panel").classList.remove("hidden");
});

// ---------- actualizar lista de solicitudes (admin) ----------
function actualizarSolicitudesList(){
  solicitudesList.innerHTML = "";
  const pendientes = solicitudes.filter(s => s.estado === "pendiente");
  if(pendientes.length === 0){
    solicitudesList.innerHTML = "<li class='list-empty'>No hay solicitudes pendientes</li>";
    return;
  }
  pendientes.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div>
        <strong>${s.usuario}</strong> solicitó <em>${s.item}</em> — ${s.dias} días — Solicitud: ${new Date(s.fechaSolicitud).toLocaleDateString()}
      </div>
      <div>
        <button class="btn btn-primary" onclick="aceptarSolicitud('${s.id}')">Aceptar</button>
        <button class="btn btn-light" onclick="rechazarSolicitud('${s.id}')">Rechazar</button>
        <button class="btn btn-secondary" onclick="verDetalle('${s.id}')">Ver</button>
      </div>
    `;
    solicitudesList.appendChild(li);
  });
}

// ---------- aceptar / rechazar (admin) ----------
window.aceptarSolicitud = function(id){
  const idx = solicitudes.findIndex(s => String(s.id) === String(id));
  if(idx === -1) return alert("Solicitud no encontrada");
  const s = solicitudes[idx];
  s.estado = "aceptado";
  // agregar a prestamos
  prestamos.push({
    id: s.id,
    usuario: s.usuario,
    item: s.item,
    dias: s.dias,
    fechaSolicitud: s.fechaSolicitud,
    fechaEntrega: s.fechaEntrega
  });
  // eliminar de solicitudes (o marcar como aceptado)
  solicitudes.splice(idx,1);
  saveState();
  actualizarSolicitudesList();
  actualizarSeguimientoList();
  alert("Solicitud aceptada.");
}

window.rechazarSolicitud = function(id){
  const idx = solicitudes.findIndex(s => String(s.id) === String(id));
  if(idx === -1) return alert("Solicitud no encontrada");
  solicitudes.splice(idx,1);
  saveState();
  actualizarSolicitudesList();
  alert("Solicitud rechazada.");
}

window.verDetalle = function(id){
  const s = solicitudes.find(x => String(x.id) === String(id));
  if(!s) return alert("Solicitud no encontrada");
  alert(`Detalle:\nUsuario: ${s.usuario}\nItem: ${s.item}\nDías: ${s.dias}\nSolicitado: ${new Date(s.fechaSolicitud).toLocaleString()}`);
}

// ---------- seguimiento (admin): prestamos activos ----------
function actualizarSeguimientoList(){
  seguimientoList.innerHTML = "";
  if(prestamos.length === 0){
    seguimientoList.innerHTML = "<p>No hay préstamos activos</p>";
    resumenMes.textContent = "";
    return;
  }
  const hoy = new Date();
  let totalMes = 0;
  prestamos.forEach(p => {
    const fechaEntrega = new Date(p.fechaEntrega);
    const diasRestantes = Math.ceil((fechaEntrega - hoy) / (1000*60*60*24));
    const estado = diasRestantes >= 0 ? `${diasRestantes} día(s) restantes` : `Vencido hace ${Math.abs(diasRestantes)} día(s)`;
    const div = document.createElement("div");
    div.className = "prestamo";
    div.innerHTML = `<strong>${p.usuario}</strong> — ${p.item} — ${estado}`;
    seguimientoList.appendChild(div);

    // si pertenece al mes actual
    if(new Date(p.fechaSolicitud).getMonth() === hoy.getMonth() && new Date(p.fechaSolicitud).getFullYear() === hoy.getFullYear()){
      totalMes++;
    }
  });
  resumenMes.textContent = `Total préstamos este mes: ${totalMes}`;
}

// ---------- Init: attach listeners y render inicial ----------
function init(){
  attachSolicitarListeners();
  // render usuario si ya hay usuarioActual (no persistimos sesión por simplicidad)
  renderUserRequests();
  actualizarSolicitudesList();
  actualizarSeguimientoList();
}
init();
