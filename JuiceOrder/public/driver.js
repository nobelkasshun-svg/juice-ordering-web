/* eslint-disable */
let currentUser = null;
let map = null;
let markers = [];

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('login-error');

    if (!username || !password) {
    error.textContent = '❌ Please enter username and password';
    return;
    }

    const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
    error.textContent = '❌ ' + data.error;
    return;
    }

    if (data.user.role !== 'driver') {
    error.textContent = '❌ This page is for drivers only';
    return;
    }

    currentUser = data.user;
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard-page').style.display = 'block';
    document.getElementById('driver-name').textContent = `👤 ${currentUser.name}`;
    document.getElementById('truck-info').textContent = `🚛 Truck: ${currentUser.truck_code}`;

    initMap();
    loadDeliveries();
}

function logout() {
    currentUser = null;
    map = null;
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('dashboard-page').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function initMap() {
    if (map) return;
    map = L.map('map').setView([9.03, 38.74], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
    }).addTo(map);
}

async function loadDeliveries() {
    const response = await fetch(`/driver/${currentUser.truck_code}/all`);
    const orders = await response.json();

    const pending = orders.filter(o => o.status === 'Assigned');
    const completed = orders.filter(o => o.status === 'Delivered');

    renderDeliveries(pending);
    renderCompleted(completed);
    updateMap(pending);
}

function renderDeliveries(orders) {
    const div = document.getElementById('delivery-list');

    if (orders.length === 0) {
    div.innerHTML = '<p style="color:#888; font-size:13px;">No pending deliveries assigned to you.</p>';
    return;
    }

    div.innerHTML = orders.map((o, i) => `
    <div class="order-card assigned" id="order-${o.id}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
        <div class="order-id">🛑 Stop ${i + 1} — #${o.id}</div>
        <span style="background:#fff3e0; color:#e65100; padding:3px 8px; border-radius:20px; font-size:11px;">
            ${o.status}
        </span>
        </div>
        <div style="font-weight:bold; font-size:15px; margin:5px 0;">${o.shop_name}</div>
        <div class="order-location">📍 ${o.location}</div>
        <div style="margin:5px 0;">📱 ${o.phone}</div>
        <div>🍊 ${o.juice_type} | ${o.size}</div>
        <div>${o.quantity} packets — ${o.total_bottles} bottles</div>
        <div style="color:#e65100; font-weight:bold; font-size:15px; margin:5px 0;">
        💰 ${Number(o.total_price).toLocaleString()} ETB — ${o.payment_method}
        </div>
        ${o.latitude && o.longitude ? `
        <button style="background:#1976d2; margin-top:5px;" onclick="focusOnMap(${o.latitude}, ${o.longitude}, '${o.shop_name}')">
            🗺️ Show on Map
        </button>
        ` : ''}
        <button style="background:#2e7d32; margin-top:5px;" onclick="markDelivered(${o.id})">
        ✅ Mark as Delivered / ደርሷል
        </button>
    </div>
    `).join('');
}

function renderCompleted(orders) {
    const div = document.getElementById('completed-list');

    if (orders.length === 0) {
    div.innerHTML = '<p style="color:#888; font-size:13px;">No completed deliveries yet.</p>';
    return;
    }

    div.innerHTML = orders.map(o => `
    <div class="order-card delivered">
        <div class="order-id">#${o.id} — ${o.shop_name}</div>
        <div class="order-location">📍 ${o.location}</div>
        <div>${o.juice_type} | ${o.size} | ${o.quantity} packets</div>
        <div style="color:#2e7d32; font-weight:bold;">✅ Delivered</div>
    </div>
    `).join('');
}

function updateMap(orders) {
    if (!map) return;

    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const validOrders = orders.filter(o => o.latitude && o.longitude);

    if (validOrders.length === 0) {
    return;
    }

    validOrders.forEach((o, i) => {
    const marker = L.marker([o.latitude, o.longitude])
        .addTo(map)
        .bindPopup(`
        <b>Stop ${i + 1}: ${o.shop_name}</b><br>
        📍 ${o.location}<br>
        📱 ${o.phone}<br>
        🍊 ${o.juice_type} | ${o.size}<br>
        💰 ${Number(o.total_price).toLocaleString()} ETB
        `);
    markers.push(marker);
    });

  // Draw route line between stops
    if (validOrders.length > 1) {
    const latlngs = validOrders.map(o => [o.latitude, o.longitude]);
    const polyline = L.polyline(latlngs, { color: '#e65100', weight: 3, dashArray: '8' }).addTo(map);
    markers.push(polyline);
    map.fitBounds(polyline.getBounds().pad(0.2));
    } else {
    map.setView([validOrders[0].latitude, validOrders[0].longitude], 14);
    }
}

function focusOnMap(lat, lng, name) {
    if (!map) return;
    map.setView([lat, lng], 16);
    markers.forEach(m => {
    if (m.getLatLng && m.getLatLng().lat === lat) {
        m.openPopup();
    }
    });
}

async function markDelivered(id) {
    const response = await fetch(`/deliver/${id}`, { method: 'POST' });
    const data = await response.json();

    const card = document.getElementById(`order-${id}`);
    if (card) {
    card.style.opacity = '0.5';
    card.innerHTML += `<div style="color:green; font-weight:bold; margin-top:5px;">✅ Marked as Delivered!</div>`;
    }

    setTimeout(() => loadDeliveries(), 1000);
}

// Auto refresh every 60 seconds
setInterval(() => { if (currentUser) loadDeliveries(); }, 60000);