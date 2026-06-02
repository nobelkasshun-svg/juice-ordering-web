/* eslint-disable */
let selectedOrders = [];
let currentEmployee = null;
let lastOrderCount = 0;

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

    if (response.ok) {
    currentEmployee = data.user;
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard-page').style.display = 'block';
    document.getElementById('employee-name').textContent = `👤 ${currentEmployee.name}`;
    loadAll();

    // Start tracking order count for notifications
    setTimeout(async () => {
        const res = await fetch('/admin/orders');
        const orders = await res.json();
        lastOrderCount = orders.filter(o => o.status === 'Pending').length;
    }, 1000);

    } else {
    error.textContent = '❌ ' + data.error;
    }
}

function logout() {
    currentEmployee = null;
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('dashboard-page').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

async function loadAll() {
    await loadOrders();
    await loadTrucks();
}

async function loadOrders() {
    const response = await fetch('/admin/orders');
    const orders = await response.json();

    const pending = orders.filter(o => o.status === 'Pending');
    const assigned = orders.filter(o => o.status === 'Assigned');
    const delivered = orders.filter(o => o.status === 'Delivered');

    renderPending(pending);
    renderAssigned(assigned);
    renderDelivered(delivered);
}

function renderPending(orders) {
    const div = document.getElementById('pending-orders');
    if (orders.length === 0) {
    div.innerHTML = '<p style="color:#888; font-size:13px;">No pending orders</p>';
    return;
    }
    div.innerHTML = orders.map(o => {
    let juicesSummary = '';
    try {
        const items = JSON.parse(o.items || '[]');
        juicesSummary = items.map(i => `${i.juice} ${i.size} ×${i.qty}pkt`).join('<br>');
    } catch { juicesSummary = '-'; }

    return `
        <div class="order-card ${selectedOrders.includes(o.id) ? 'selected' : ''}"
            onclick="toggleSelect(${o.id}, this)">
        <div class="order-id">#${o.id} — ${o.shop_name}</div>
        <div class="order-location">📍 ${o.location}</div>
        <div style="font-size:12px; margin:4px 0;">${juicesSummary}</div>
        <div>📦 ${o.total_packets || 0} packets</div>
        <div style="color:#e65100; font-weight:bold;">${Number(o.total_price).toLocaleString()} ETB</div>
        <div style="font-size:11px; color:#888;">${o.order_date}</div>
        </div>
    `;
    }).join('');
}

function renderAssigned(orders) {
    const div = document.getElementById('assigned-orders');
    if (orders.length === 0) {
    div.innerHTML = '<p style="color:#888; font-size:13px;">No assigned orders</p>';
    return;
    }
    div.innerHTML = orders.map(o => `
    <div class="order-card assigned">
        <div class="order-id">#${o.id} — ${o.shop_name}</div>
        <div class="order-location">📍 ${o.location}</div>
        <div class="order-truck">🚛 Truck: ${o.assigned_truck}</div>
        <div>📦 ${o.total_packets || 0} packets</div>
        <div style="color:#e65100; font-weight:bold;">${Number(o.total_price).toLocaleString()} ETB</div>
    </div>
    `).join('');
}

function renderDelivered(orders) {
    const div = document.getElementById('delivered-orders');
    if (orders.length === 0) {
    div.innerHTML = '<p style="color:#888; font-size:13px;">No delivered orders yet</p>';
    return;
    }
    div.innerHTML = orders.map(o => `
    <div class="order-card delivered">
        <div class="order-id">#${o.id} — ${o.shop_name}</div>
        <div class="order-location">📍 ${o.location}</div>
        <div class="order-truck">🚛 ${o.assigned_truck}</div>
        <div style="color:#2e7d32; font-weight:bold;">✅ Delivered</div>
    </div>
    `).join('');
}

function toggleSelect(id, el) {
    if (selectedOrders.includes(id)) {
    selectedOrders = selectedOrders.filter(i => i !== id);
    el.classList.remove('selected');
    } else {
    selectedOrders.push(id);
    el.classList.add('selected');
    }
}

async function loadTrucks() {
    const response = await fetch('/trucks');
    const trucks = await response.json();

    const select = document.getElementById('truck-select');
    select.innerHTML = '<option value="">-- Select Truck --</option>';
    trucks.forEach(t => {
    select.innerHTML += `<option value="${t.truck_code}">${t.truck_code} — ${t.driver_name}</option>`;
    });

    const list = document.getElementById('trucks-list');
    list.innerHTML = trucks.map(t => `
    <div class="truck-card">
        <div>
        <span class="truck-code">${t.truck_code}</span>
        <span style="margin-left:8px;">${t.driver_name}</span>
        </div>
        <span class="${t.status === 'Available' ? 'truck-available' : 'truck-busy'}">${t.status}</span>
    </div>
    `).join('');
}

async function assignOrders() {
    const truck_code = document.getElementById('truck-select').value;
    const msg = document.getElementById('assign-message');

    if (selectedOrders.length === 0) {
    msg.style.color = 'red';
    msg.textContent = '❌ Please select at least one order';
    return;
    }

    if (!truck_code) {
    msg.style.color = 'red';
    msg.textContent = '❌ Please select a truck';
    return;
    }

    const response = await fetch('/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_ids: selectedOrders, truck_code })
    });

    const data = await response.json();
    msg.style.color = 'green';
    msg.textContent = data.message;
    selectedOrders = [];
    loadAll();
}

async function addTruck() {
    const truck_code = document.getElementById('new-truck-code').value;
    const driver_name = document.getElementById('new-driver-name').value;
    const msg = document.getElementById('truck-message');

    if (!truck_code || !driver_name) {
    msg.style.color = 'red';
    msg.textContent = '❌ Please fill in all fields';
    return;
    }

    const response = await fetch('/trucks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ truck_code, driver_name })
    });

    const data = await response.json();
    msg.style.color = 'green';
    msg.textContent = data.message;
    document.getElementById('new-truck-code').value = '';
    document.getElementById('new-driver-name').value = '';
    loadTrucks();
}

async function addEmployee() {
    const name = document.getElementById('new-emp-name').value;
    const username = document.getElementById('new-emp-username').value;
    const password = document.getElementById('new-emp-password').value;
    const role = document.getElementById('new-emp-role').value;
    const truck_code = document.getElementById('new-emp-truck').value;
    const msg = document.getElementById('emp-message');

    if (!name || !username || !password || !role) {
    msg.style.color = 'red';
    msg.textContent = '❌ Please fill in all fields';
    return;
    }

    if (role === 'driver' && !truck_code) {
    msg.style.color = 'red';
    msg.textContent = '❌ Please enter truck code for driver';
    return;
    }

    const response = await fetch('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, username, password, role, truck_code })
    });

    const data = await response.json();
    msg.style.color = 'green';
    msg.textContent = data.message;
    document.getElementById('new-emp-name').value = '';
    document.getElementById('new-emp-username').value = '';
    document.getElementById('new-emp-password').value = '';
    document.getElementById('new-emp-truck').value = '';
}

function toggleTruckField() {
    const role = document.getElementById('new-emp-role').value;
    const truckField = document.getElementById('truck-field');
    truckField.style.display = role === 'driver' ? 'block' : 'none';
}

// ─── NOTIFICATION SYSTEM ─────────────────────────────────

function createSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    [0, 0.2, 0.4].forEach(time => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + time);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.15);
    oscillator.start(ctx.currentTime + time);
    oscillator.stop(ctx.currentTime + time + 0.15);
    });
}

function showNotification(order) {
    const popup = document.getElementById('notification-popup');
    const text = document.getElementById('notification-text');
    text.innerHTML = `
    <strong>${order.shop_name}</strong> just placed an order!<br>
    📍 ${order.location}<br>
    📦 ${order.total_packets} packets — ${Number(order.total_price).toLocaleString()} ETB<br>
    💳 ${order.payment_method}
    `;
    popup.style.display = 'block';
    createSound();
    setTimeout(() => { popup.style.display = 'none'; }, 8000);
}

function closeNotification() {
    document.getElementById('notification-popup').style.display = 'none';
    document.getElementById('notification-badge').style.display = 'none';
}

async function checkNewOrders() {
    if (!currentEmployee) return;
    try {
    const response = await fetch('/admin/orders');
    const orders = await response.json();
    const pending = orders.filter(o => o.status === 'Pending');
    const currentCount = pending.length;

    if (lastOrderCount > 0 && currentCount > lastOrderCount) {
        const newOrders = pending.slice(0, currentCount - lastOrderCount);
        newOrders.forEach(order => showNotification(order));

        const badge = document.getElementById('notification-badge');
        badge.style.display = 'inline';
        badge.textContent = currentCount;

        renderPending(pending);
        const assigned = orders.filter(o => o.status === 'Assigned');
        const delivered = orders.filter(o => o.status === 'Delivered');
        renderAssigned(assigned);
        renderDelivered(delivered);
    }

    lastOrderCount = currentCount;
    } catch (err) {
    console.log('Check failed:', err);
    }
}

// Check for new orders every 5 seconds
setInterval(checkNewOrders, 5000);

// Auto refresh dashboard every 30 seconds
setInterval(() => { if (currentEmployee) loadAll(); }, 30000);