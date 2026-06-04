let map;
let userMarker;
let targetMarker;
let routeLine;
let accuracyCircle;

let userLocation = null;
let selectedClassroom = null;
let toastTimer = null;
let lastCompassDistance = null;
let deviceHeading = null;

const elements = {
  select: document.getElementById("classroom-select"),
  destinationCard: document.getElementById("destination-card"),
  gpsIcon: document.getElementById("gps-status-icon"),
  gpsStatusText: document.getElementById("gps-status-text"),
  accuracyText: document.getElementById("accuracy-text"),

  btnRoute: document.getElementById("btn-route"),
  btnClear: document.getElementById("btn-clear"),
  btnCenterUser: document.getElementById("btn-center-user"),
  btnCompass: document.getElementById("btn-compass"),
  btnBackMap: document.getElementById("btn-back-map"),

  bottomSheet: document.getElementById("bottom-sheet"),
  btnToggleSheet: document.getElementById("btn-toggle-sheet"),
  sheetToggleIcon: document.getElementById("sheet-toggle-icon"),

  mapView: document.getElementById("map-view"),
  compassView: document.getElementById("compass-view"),
  compassTitle: document.getElementById("compass-title"),
  compassDistance: document.getElementById("compass-distance"),
  compassStatus: document.getElementById("compass-status"),
  compassHelp: document.getElementById("compass-help"),
  compassArrow: document.getElementById("compass-arrow"),
  compassInstructions: document.getElementById("compass-instructions"),

  toast: document.getElementById("toast"),
  toastMessage: document.getElementById("toast-message")
};

window.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadClassrooms();
  setupEvents();
  startGpsTracking();
  startCompassTracking();
});

function initMap() {
  map = L.map("map", {
    zoomControl: false
  }).setView(CAMPUS_COORDS, 18);

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
    L.marker([classroom.lat, classroom.lng], {
      icon: createSmallCampusIcon(classroom.name)
    })
      .addTo(map)
      .bindPopup(`
        <strong>${classroom.name}</strong><br>
        ${classroom.building}<br>
        ${classroom.floor}
      `);
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
    lastCompassDistance = null;
    showDestinationInfo();
    showTargetOnMap();
  });

  elements.btnRoute.addEventListener("click", () => {
    if (!selectedClassroom) return showToast("Selecciona primero un destino.");
    if (!userLocation) return showToast("Aún no se detecta tu ubicación GPS.");
    drawRoute();
  });

  elements.btnCompass.addEventListener("click", async () => {
    if (!selectedClassroom) return showToast("Selecciona primero un destino.");
    if (!userLocation) return showToast("Aún no se detecta tu ubicación GPS.");

    await requestCompassPermission();
    openCompassMode();
  });

  elements.btnBackMap.addEventListener("click", () => {
    switchView("map");
    setTimeout(() => map.invalidateSize(), 200);
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

  elements.btnToggleSheet.addEventListener("click", () => {
    elements.bottomSheet.classList.toggle("collapsed");

    const isCollapsed = elements.bottomSheet.classList.contains("collapsed");
    elements.sheetToggleIcon.textContent = isCollapsed
      ? "keyboard_arrow_up"
      : "keyboard_arrow_down";

    setTimeout(() => map.invalidateSize(), 300);
  });
}

function startGpsTracking() {
  if (!navigator.geolocation) {
    updateGpsStatus("Tu navegador no soporta geolocalización.", "gps_off", "danger");
    return;
  }

  navigator.geolocation.watchPosition(
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
      if (elements.compassView.classList.contains("active")) updateCompassMode();
    },
    (error) => {
      const messages = {
        1: "Permiso de ubicación denegado. Activa el GPS.",
        2: "No se pudo obtener la ubicación. Intenta en un lugar más abierto.",
        3: "El GPS tardó demasiado en responder."
      };

      const message = messages[error.code] || "Error obteniendo ubicación.";
      updateGpsStatus(message, "gps_off", "danger");
      showToast(message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );
}

function startCompassTracking() {
  window.addEventListener("deviceorientationabsolute", handleDeviceOrientation, true);
  window.addEventListener("deviceorientation", handleDeviceOrientation, true);
}

async function requestCompassPermission() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const response = await DeviceOrientationEvent.requestPermission();

      if (response !== "granted") {
        showToast("No se otorgó permiso para usar la brújula del teléfono.");
      }
    } catch {
      showToast("No se pudo solicitar permiso de brújula.");
    }
  }
}

function handleDeviceOrientation(event) {
  if (typeof event.webkitCompassHeading === "number") {
    deviceHeading = event.webkitCompassHeading;
  } else if (typeof event.alpha === "number") {
    deviceHeading = 360 - event.alpha;
  }

  if (elements.compassView.classList.contains("active")) {
    updateCompassMode();
  }
}

function showDestinationInfo() {
  if (!selectedClassroom) return;

  const distance = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        selectedClassroom.lat,
        selectedClassroom.lng
      )
    : null;

  const distanceText = distance ? `${distance.toFixed(1)} m` : "GPS pendiente";

  elements.destinationCard.innerHTML = `
    <div class="destination-header">
      <div class="destination-title">
        <h2>${selectedClassroom.name}</h2>
        <span class="badge">${selectedClassroom.floor}</span>
      </div>
      <p class="destination-meta">
        ${selectedClassroom.building} · ${selectedClassroom.reference}
      </p>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <span>Distancia aproximada</span>
        <strong>${distanceText}</strong>
      </div>
      <div class="info-box">
        <span>Guía disponible</span>
        <strong>Mapa + brújula + texto</strong>
      </div>
    </div>

    <div class="instructions">
      <h3>Indicaciones textuales</h3>
      <ol>
        ${selectedClassroom.instructions.map((step) => `<li>${step}</li>`).join("")}
      </ol>

      <div class="note">
        Importante: el GPS puede llevarte al punto del edificio, pero no reconoce con precisión el piso. Por eso se muestran instrucciones internas.
      </div>
    </div>
  `;
}

function showTargetOnMap() {
  if (!selectedClassroom) return;

  if (targetMarker) map.removeLayer(targetMarker);

  targetMarker = L.marker([selectedClassroom.lat, selectedClassroom.lng], {
    icon: createTargetIcon(selectedClassroom.name)
  })
    .addTo(map)
    .bindPopup(`
      <strong>${selectedClassroom.name}</strong><br>
      ${selectedClassroom.building}<br>
      ${selectedClassroom.floor}
    `)
    .openPopup();

  const points = userLocation
    ? [
        [userLocation.lat, userLocation.lng],
        [selectedClassroom.lat, selectedClassroom.lng]
      ]
    : [CAMPUS_COORDS, [selectedClassroom.lat, selectedClassroom.lng]];

  map.fitBounds(L.latLngBounds(points), {
    padding: [80, 80]
  });
}

function drawRoute(showMessage = true) {
  if (!userLocation || !selectedClassroom) return;

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(
    [
      [userLocation.lat, userLocation.lng],
      [selectedClassroom.lat, selectedClassroom.lng]
    ],
    {
      color: "#bc1821",
      weight: 5,
      opacity: 0.85,
      dashArray: "10, 10"
    }
  ).addTo(map);

  map.fitBounds(routeLine.getBounds(), {
    padding: [90, 90]
  });

  showDestinationInfo();

  if (showMessage) {
    showToast("Ruta trazada. Revisa también las indicaciones del piso.");
  }
}

function openCompassMode() {
  switchView("compass");

  elements.compassTitle.textContent = selectedClassroom.name;

  elements.compassInstructions.innerHTML = `
    <h3>Indicaciones internas</h3>
    <ol>
      ${selectedClassroom.instructions.map((step) => `<li>${step}</li>`).join("")}
    </ol>
  `;

  updateCompassMode();
}

function updateCompassMode() {
  if (!userLocation || !selectedClassroom) return;

  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    selectedClassroom.lat,
    selectedClassroom.lng
  );

  const bearingToTarget = calculateBearing(
    userLocation.lat,
    userLocation.lng,
    selectedClassroom.lat,
    selectedClassroom.lng
  );

  let arrowRotation = bearingToTarget;

  if (deviceHeading !== null) {
    arrowRotation = bearingToTarget - deviceHeading;
  }

  elements.compassArrow.style.transform = `rotate(${arrowRotation}deg)`;
  elements.compassDistance.innerHTML = `${distance.toFixed(1)}<span>m</span>`;
  elements.compassStatus.className = "status-pill";

  if (distance <= 4) {
    elements.compassStatus.classList.add("arrived");
    elements.compassStatus.innerHTML = `
      <span class="material-symbols-rounded">stars</span>
      Llegaste al punto del edificio
    `;
    elements.compassHelp.textContent = `Ahora revisa: ${selectedClassroom.floor}. ${selectedClassroom.reference}`;
    elements.compassArrow.style.color = "#16a34a";

    if (navigator.vibrate) navigator.vibrate([160, 80, 160]);
  } else if (deviceHeading === null) {
    elements.compassStatus.innerHTML = `
      <span class="material-symbols-rounded">explore</span>
      Brújula no disponible
    `;
    elements.compassHelp.textContent =
      "El GPS sí funciona, pero este navegador o dispositivo no está entregando orientación. En teléfono real suele funcionar mejor.";
    elements.compassArrow.style.color = "#172033";
  } else if (lastCompassDistance === null) {
    elements.compassStatus.innerHTML = `
      <span class="material-symbols-rounded">explore</span>
      Sigue la flecha
    `;
    elements.compassHelp.textContent =
      "Camina con el teléfono al frente. Si la distancia baja, vas en buena dirección.";
    elements.compassArrow.style.color = "#172033";
  } else if (distance < lastCompassDistance) {
    elements.compassStatus.classList.add("near");
    elements.compassStatus.innerHTML = `
      <span class="material-symbols-rounded">trending_down</span>
      Te estás acercando
    `;
    elements.compassHelp.textContent = `Sigue avanzando. Precisión GPS: ±${userLocation.accuracy.toFixed(0)} m.`;
    elements.compassArrow.style.color = "#16a34a";
  } else {
    elements.compassStatus.classList.add("away");
    elements.compassStatus.innerHTML = `
      <span class="material-symbols-rounded">trending_up</span>
      Te estás alejando
    `;
    elements.compassHelp.textContent =
      "Gira o cambia de dirección hasta que la distancia empiece a bajar.";
    elements.compassArrow.style.color = "#dc2626";
  }

  lastCompassDistance = distance;
}

function switchView(view) {
  elements.mapView.classList.toggle("active", view === "map");
  elements.compassView.classList.toggle("active", view === "compass");
}

function clearRoute() {
  if (routeLine) map.removeLayer(routeLine);
  if (targetMarker) map.removeLayer(targetMarker);

  routeLine = null;
  targetMarker = null;
  selectedClassroom = null;
  lastCompassDistance = null;

  elements.select.value = "";

  elements.destinationCard.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-rounded">location_on</span>
      <p>Selecciona un destino para ver ruta, distancia e indicaciones.</p>
    </div>
  `;

  switchView("map");

  setTimeout(() => map.invalidateSize(), 200);

  map.setView(userLocation ? [userLocation.lat, userLocation.lng] : CAMPUS_COORDS, 18);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const lambda1 = lon1 * Math.PI / 180;
  const lambda2 = lon2 * Math.PI / 180;

  const y = Math.sin(lambda2 - lambda1) * Math.cos(phi2);

  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) *
      Math.cos(phi2) *
      Math.cos(lambda2 - lambda1);

  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function createUserIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:20px;
        height:20px;
        border-radius:50%;
        background:#06b6d4;
        border:4px solid white;
        box-shadow:0 0 0 6px rgba(6,182,212,.20),0 8px 20px rgba(0,0,0,.35);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

function createTargetIcon(title) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        background:#bc1821;
        color:white;
        border:2px solid white;
        border-radius:14px;
        padding:7px 10px;
        font-weight:700;
        font-size:12px;
        box-shadow:0 8px 18px rgba(0,0,0,.28);
        white-space:nowrap;
      ">📍 ${title}</div>
    `,
    iconAnchor: [18, 18]
  });
}

function createSmallCampusIcon(title) {
  return L.divIcon({
    className: "",
    html: `
      <div title="${title}" style="
        width:13px;
        height:13px;
        background:#172033;
        border:2px solid white;
        border-radius:50%;
        box-shadow:0 4px 12px rgba(0,0,0,.25);
      "></div>
    `,
    iconSize: [13, 13],
    iconAnchor: [6, 6]
  });
}

function updateGpsStatus(text, icon, type) {
  elements.gpsStatusText.textContent = text;
  elements.gpsIcon.textContent = icon;

  const colors = {
    success: "#22c55e",
    danger: "#fecaca",
    warning: "#fde68a"
  };

  elements.gpsIcon.style.color = colors[type] || "white";
}

function showToast(message) {
  elements.toastMessage.textContent = message;
  elements.toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 3600);
}