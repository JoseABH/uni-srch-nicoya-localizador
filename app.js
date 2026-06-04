let map;
let userMarker;
let targetMarker;
let routeLine;
let accuracyCircle;
let userLocation = null;
let selectedClassroom = null;
let watchId = null;
let toastTimer = null;
let lastAirtagDistance = null;

const elements = {
  select: document.getElementById("classroom-select"),
  destinationCard: document.getElementById("destination-card"),
  gpsIcon: document.getElementById("gps-status-icon"),
  gpsStatusText: document.getElementById("gps-status-text"),
  accuracyText: document.getElementById("accuracy-text"),
  btnRoute: document.getElementById("btn-route"),
  btnClear: document.getElementById("btn-clear"),
  btnCenterUser: document.getElementById("btn-center-user"),
  btnAirtag: document.getElementById("btn-airtag"),
  btnBackMap: document.getElementById("btn-back-map"),
  mapView: document.getElementById("map-view"),
  airtagView: document.getElementById("airtag-view"),
  airtagTitle: document.getElementById("airtag-title"),
  airtagDistance: document.getElementById("airtag-distance"),
  airtagStatus: document.getElementById("airtag-status"),
  airtagHelp: document.getElementById("airtag-help"),
  airtagArrow: document.getElementById("airtag-arrow"),
  airtagInstructions: document.getElementById("airtag-instructions"),
  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toast-message")
};

window.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadClassrooms();
  setupEvents();
  startGpsTracking();
});

function initMap() {
  map = L.map("map", { zoomControl: false }).setView(CAMPUS_COORDS, 18);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 21,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  L.control.zoom({ position: "topright" }).addTo(map);

  userMarker = L.marker(CAMPUS_COORDS, { icon: createUserIcon() })
    .addTo(map)
    .bindPopup("Ubicación inicial del campus");

  accuracyCircle = L.circle(CAMPUS_COORDS, {
    radius: 0,
    color: "#06b6d4",
    fillColor: "#06b6d4",
    fillOpacity: 0.12,
    weight: 1
  }).addTo(map);

  CLASSROOMS.forEach((classroom) => {
    L.marker([classroom.lat, classroom.lng], { icon: createSmallCampusIcon(classroom.name) })
      .addTo(map)
      .bindPopup(`<strong>${classroom.name}</strong><br>${classroom.building}<br>${classroom.floor}`);
  });
}

function loadClassrooms() {
  CLASSROOMS.forEach((classroom) => {
    const option = document.createElement("option");
    option.value = classroom.id;
    option.textContent = `${classroom.name} - ${classroom.floor}`;
    elements.select.appendChild(option);
  });
}

function setupEvents() {
  elements.select.addEventListener("change", () => {
    selectedClassroom = CLASSROOMS.find((item) => item.id === elements.select.value);
    lastAirtagDistance = null;
    showDestinationInfo();
    showTargetOnMap();
  });

  elements.btnRoute.addEventListener("click", () => {
    if (!selectedClassroom) return showToast("Selecciona primero un aula destino.");
    if (!userLocation) return showToast("Aún no se detecta tu ubicación. Revisa permisos del navegador.");
    drawRoute();
  });

  elements.btnAirtag.addEventListener("click", () => {
    if (!selectedClassroom) return showToast("Selecciona primero un aula para usar el modo AirTag.");
    if (!userLocation) return showToast("Aún no se detecta tu ubicación GPS.");
    openAirtagMode();
  });

  elements.btnBackMap.addEventListener("click", () => {
    switchView("map");
    setTimeout(() => map.invalidateSize(), 180);
  });

  elements.btnClear.addEventListener("click", clearRoute);

  elements.btnCenterUser.addEventListener("click", () => {
    if (!userLocation) {
      map.setView(CAMPUS_COORDS, 18);
      showToast("Todavía no hay ubicación GPS real. Se muestra el centro del campus.");
      return;
    }
    map.setView([userLocation.lat, userLocation.lng], 19);
  });
}

function startGpsTracking() {
  if (!navigator.geolocation) {
    updateGpsStatus("Tu navegador no soporta geolocalización.", "gps_off", "danger");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      const currentLatLng = [userLocation.lat, userLocation.lng];
      userMarker.setLatLng(currentLatLng).bindPopup("Estás aquí");
      accuracyCircle.setLatLng(currentLatLng);
      accuracyCircle.setRadius(userLocation.accuracy);

      updateGpsStatus("Ubicación detectada correctamente", "gps_fixed", "success");
      elements.accuracyText.textContent = `± ${userLocation.accuracy.toFixed(0)} m`;

      if (selectedClassroom) showDestinationInfo();
      if (routeLine && selectedClassroom) drawRoute(false);
      if (elements.airtagView.classList.contains("active")) updateAirtagMode();
    },
    (error) => {
      const messages = {
        1: "Permiso de ubicación denegado. Activa el GPS para usar la app.",
        2: "No se pudo obtener la ubicación. Intenta en un lugar más abierto.",
        3: "El GPS tardó demasiado en responder. Intenta nuevamente."
      };
      updateGpsStatus(messages[error.code] || "Error obteniendo ubicación.", "gps_off", "danger");
      showToast(messages[error.code] || "Error obteniendo ubicación.");
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
  );
}

function showDestinationInfo() {
  if (!selectedClassroom) return;

  const distance = userLocation
    ? calculateDistance(userLocation.lat, userLocation.lng, selectedClassroom.lat, selectedClassroom.lng)
    : null;

  const distanceText = distance ? `${distance.toFixed(1)} m` : "GPS pendiente";

  elements.destinationCard.innerHTML = `
    <div class="destination-header">
      <div class="destination-title">
        <h2>${selectedClassroom.name}</h2>
        <span class="badge">${selectedClassroom.floor}</span>
      </div>
      <p class="destination-meta">${selectedClassroom.building} · ${selectedClassroom.reference}</p>
    </div>
    <div class="info-grid">
      <div class="info-box"><span>Distancia aproximada</span><strong>${distanceText}</strong></div>
      <div class="info-box"><span>Guía disponible</span><strong>Mapa + AirTag + texto</strong></div>
    </div>
    <div class="instructions">
      <h3>Indicaciones textuales</h3>
      <ol>${selectedClassroom.instructions.map((step) => `<li>${step}</li>`).join("")}</ol>
      <div class="note">Importante: el GPS puede llevarte al punto del edificio, pero no reconoce con precisión si el aula está en primer o segundo piso. Por eso se muestran indicaciones internas como piso, edificio y referencia.</div>
    </div>
  `;
}

function showTargetOnMap() {
  if (!selectedClassroom) return;
  if (targetMarker) map.removeLayer(targetMarker);

  targetMarker = L.marker([selectedClassroom.lat, selectedClassroom.lng], { icon: createTargetIcon(selectedClassroom.name) })
    .addTo(map)
    .bindPopup(`<strong>${selectedClassroom.name}</strong><br>${selectedClassroom.building}<br>${selectedClassroom.floor}`)
    .openPopup();

  const points = userLocation
    ? [[userLocation.lat, userLocation.lng], [selectedClassroom.lat, selectedClassroom.lng]]
    : [CAMPUS_COORDS, [selectedClassroom.lat, selectedClassroom.lng]];

  map.fitBounds(L.latLngBounds(points), { padding: [70, 70] });
}

function drawRoute(showMessage = true) {
  if (!userLocation || !selectedClassroom) return;
  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline([
    [userLocation.lat, userLocation.lng],
    [selectedClassroom.lat, selectedClassroom.lng]
  ], { color: "#bc1821", weight: 5, opacity: 0.85, dashArray: "10, 10" }).addTo(map);

  map.fitBounds(routeLine.getBounds(), { padding: [80, 80] });
  showDestinationInfo();
  if (showMessage) showToast("Ruta trazada. Revisa también las indicaciones del piso.");
}

function openAirtagMode() {
  switchView("airtag");
  elements.airtagTitle.textContent = selectedClassroom.name;
  elements.airtagInstructions.innerHTML = `
    <h3>Indicaciones internas</h3>
    <ol>${selectedClassroom.instructions.map((step) => `<li>${step}</li>`).join("")}</ol>
  `;
  updateAirtagMode();
}

function updateAirtagMode() {
  if (!userLocation || !selectedClassroom) return;

  const distance = calculateDistance(userLocation.lat, userLocation.lng, selectedClassroom.lat, selectedClassroom.lng);
  const bearing = calculateBearing(userLocation.lat, userLocation.lng, selectedClassroom.lat, selectedClassroom.lng);

  elements.airtagDistance.innerHTML = `${distance.toFixed(1)}<span>m</span>`;
  elements.airtagArrow.style.transform = `rotate(${bearing}deg)`;

  elements.airtagStatus.className = "status-pill";

  if (distance <= 3) {
    elements.airtagStatus.classList.add("arrived");
    elements.airtagStatus.innerHTML = `<span class="material-symbols-rounded">stars</span> Llegaste al punto del edificio`;
    elements.airtagHelp.textContent = `Ahora revisa: ${selectedClassroom.floor}. ${selectedClassroom.reference}`;
    elements.airtagArrow.style.color = "#16a34a";
    if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
  } else if (lastAirtagDistance === null) {
    elements.airtagStatus.innerHTML = `<span class="material-symbols-rounded">explore</span> Camina para calcular cercanía`;
    elements.airtagHelp.textContent = "La flecha marca el rumbo aproximado al destino. La precisión depende del GPS del teléfono.";
    elements.airtagArrow.style.color = "#172033";
  } else if (distance < lastAirtagDistance) {
    elements.airtagStatus.classList.add("near");
    elements.airtagStatus.innerHTML = `<span class="material-symbols-rounded">trending_down</span> Te estás acercando`;
    elements.airtagHelp.textContent = `Sigue avanzando. Precisión actual del GPS: ±${userLocation.accuracy.toFixed(0)} m.`;
    elements.airtagArrow.style.color = "#16a34a";
  } else {
    elements.airtagStatus.classList.add("away");
    elements.airtagStatus.innerHTML = `<span class="material-symbols-rounded">trending_up</span> Te estás alejando`;
    elements.airtagHelp.textContent = "Gira o cambia de dirección hasta que la distancia empiece a bajar.";
    elements.airtagArrow.style.color = "#dc2626";
  }

  lastAirtagDistance = distance;
}

function switchView(view) {
  elements.mapView.classList.toggle("active", view === "map");
  elements.airtagView.classList.toggle("active", view === "airtag");
}

function clearRoute() {
  if (routeLine) map.removeLayer(routeLine);
  if (targetMarker) map.removeLayer(targetMarker);
  routeLine = null;
  targetMarker = null;
  selectedClassroom = null;
  lastAirtagDistance = null;
  elements.select.value = "";
  elements.destinationCard.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-rounded">location_on</span>
      <p>Selecciona un destino para ver ruta, distancia e indicaciones.</p>
    </div>`;
  switchView("map");
  setTimeout(() => map.invalidateSize(), 180);
  map.setView(userLocation ? [userLocation.lat, userLocation.lng] : CAMPUS_COORDS, 18);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const lambda1 = lon1 * Math.PI / 180;
  const lambda2 = lon2 * Math.PI / 180;
  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lambda2 - lambda1);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function createUserIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;border-radius:50%;background:#06b6d4;border:4px solid white;box-shadow:0 0 0 6px rgba(6,182,212,.20),0 8px 20px rgba(0,0,0,.35)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

function createTargetIcon(title) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#bc1821;color:white;border:2px solid white;border-radius:14px;padding:7px 10px;font-weight:700;font-size:12px;box-shadow:0 8px 18px rgba(0,0,0,.28);white-space:nowrap">📍 ${title}</div>`,
    iconAnchor: [18, 18]
  });
}

function createSmallCampusIcon(title) {
  return L.divIcon({
    className: "",
    html: `<div title="${title}" style="width:13px;height:13px;background:#172033;border:2px solid white;border-radius:50%;box-shadow:0 4px 12px rgba(0,0,0,.25)"></div>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6]
  });
}

function updateGpsStatus(text, icon, type) {
  elements.gpsStatusText.textContent = text;
  elements.gpsIcon.textContent = icon;
  const colors = { success: "#22c55e", danger: "#fecaca", warning: "#fde68a" };
  elements.gpsIcon.style.color = colors[type] || "white";
}

function showToast(message) {
  elements.toastMessage.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 3600);
}
