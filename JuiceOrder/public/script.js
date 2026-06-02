/* eslint-disable */

const packetData = {
    '2L':  { size: '2 Liter',    bottles: 6,  pricePerPacket: 1080 },
    '1L':  { size: '1 Liter',    bottles: 8,  pricePerPacket: 760  },
    'HL':  { size: 'Half Liter', bottles: 10, pricePerPacket: 500  }
};

const juiceList = [
    { key: 'orange',     name: '🍊 Fresh Orange'     },
    { key: 'mango',      name: '🥭 Fresh Mango'       },
    { key: 'strawberry', name: '🍓 Fresh Strawberry'  },
    { key: 'pineapple',  name: '🍍 Fresh Pineapple'   }
];

const sizeKeys = ['2L', '1L', 'HL'];

const paymentNumbers = {
    'Telebirr': '0911 234 567',
    'CBE':      '1000 234567890'
};

let currentOrder = {};
let currentLat = null;
let currentLng = null;

// ─── AUTO CALCULATE ──────────────────────────────────────

function updateTotal() {
    let totalPackets = 0;
    let totalPrice = 0;
    let totalBottles = 0;

    juiceList.forEach(juice => {
    sizeKeys.forEach(sizeKey => {
        const qty = parseInt(document.getElementById(`qty_${juice.key}_${sizeKey}`).value) || 0;
        const info = document.getElementById(`info_${juice.key}_${sizeKey}`);
        const data = packetData[sizeKey];

        if (qty > 0) {
        const linePrice = data.pricePerPacket * qty;
        const lineBottles = data.bottles * qty;
        totalPackets += qty;
        totalPrice += linePrice;
        totalBottles += lineBottles;
        info.textContent = `= ${lineBottles} bottles = ${linePrice.toLocaleString()} ETB`;
        } else {
        info.textContent = '';
        }
    });
    });

    const totalBox = document.getElementById('total-box');
    const warning = document.getElementById('min-warning');

    if (totalPackets > 0) {
    totalBox.style.display = 'block';

    if (totalPackets < 15) {
        totalBox.innerHTML = `📦 Total Packets: <strong>${totalPackets}</strong> — ⚠️ Minimum is 15 packets`;
        totalBox.style.background = '#fff3e0';
        totalBox.style.borderLeftColor = 'red';
        totalBox.style.color = 'red';
        warning.style.display = 'block';
        warning.textContent = `❌ You have ${totalPackets} packet(s). You need ${15 - totalPackets} more to reach the minimum of 15.`;
    } else {
        totalBox.innerHTML = `
        📦 Total Packets: <strong>${totalPackets}</strong> &nbsp;|&nbsp;
        🍾 Total Bottles: <strong>${totalBottles}</strong> &nbsp;|&nbsp;
        💰 Total Price: <strong>${totalPrice.toLocaleString()} ETB</strong>
        `;
        totalBox.style.background = '#e8f5e9';
        totalBox.style.borderLeftColor = '#2e7d32';
        totalBox.style.color = '#2e7d32';
        warning.style.display = 'none';
    }
    } else {
    totalBox.style.display = 'none';
    warning.style.display = 'none';
    }
}

// ─── SHOW BILL ───────────────────────────────────────────

function showBill() {
    const shop_name = document.getElementById('shop_name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const location = document.getElementById('location').value.trim();
    const payment_method = document.getElementById('payment_method').value;
    const message = document.getElementById('message');

    if (!shop_name || !phone || !location || !payment_method) {
    message.textContent = '❌ Please fill in all fields at the top!';
    return;
    }

    let totalPackets = 0;
    let totalPrice = 0;
    let totalBottles = 0;
    let orderItems = [];

    juiceList.forEach(juice => {
    sizeKeys.forEach(sizeKey => {
        const qty = parseInt(document.getElementById(`qty_${juice.key}_${sizeKey}`).value) || 0;
        const data = packetData[sizeKey];

        if (qty > 0) {
        const linePrice = data.pricePerPacket * qty;
        const lineBottles = data.bottles * qty;
        totalPackets += qty;
        totalPrice += linePrice;
        totalBottles += lineBottles;
        orderItems.push({
            juice: juice.name,
            size: data.size,
            qty,
            bottles: lineBottles,
            price: linePrice
        });
        }
    });
    });

    if (orderItems.length === 0) {
    message.textContent = '❌ Please enter at least one juice quantity!';
    return;
    }

    if (totalPackets < 15) {
    message.textContent = `❌ Minimum 15 packets required! You have ${totalPackets}. Add ${15 - totalPackets} more.`;
    return;
    }

    message.textContent = '';

    currentOrder = {
    shop_name, phone, location,
    latitude: currentLat,
    longitude: currentLng,
    payment_method,
    items: orderItems,
    total_packets: totalPackets,
    total_bottles: totalBottles,
    total_price: totalPrice
    };

    let billHTML = orderItems.map(item => `
    <div class="bill-row">
        <span>${item.juice} — ${item.size}</span>
        <span>${item.qty} pkt (${item.bottles} bottles) = ${item.price.toLocaleString()} ETB</span>
    </div>
    `).join('');

    billHTML += `
    <div class="bill-row"><span>Shop</span><span>${shop_name}</span></div>
    <div class="bill-row"><span>Phone</span><span>${phone}</span></div>
    <div class="bill-row"><span>Location</span><span>${location}</span></div>
    <div class="bill-row"><span>Total Packets</span><span>${totalPackets}</span></div>
    <div class="bill-row"><span>Total Bottles</span><span>${totalBottles}</span></div>
    <div class="bill-total">
        <span>💰 Total Price</span>
        <span>${totalPrice.toLocaleString()} ETB</span>
    </div>
    `;

    document.getElementById('bill-details').innerHTML = billHTML;
    document.getElementById('payment-instructions').innerHTML = `
    <p>Please send <strong>${totalPrice.toLocaleString()} ETB</strong> to:</p>
    <p>📱 <strong>${payment_method}:</strong> ${paymentNumbers[payment_method]}</p>
    <p style="margin-top:8px; color:#888; font-size:13px;">
        After payment your order will be confirmed and delivered to your location.
    </p>
    `;

    document.getElementById('order-form').style.display = 'none';
    document.getElementById('bill-section').style.display = 'flex';
}

// ─── CONFIRM ORDER ───────────────────────────────────────

async function confirmOrder() {
    const response = await fetch('/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentOrder)
    });

    const data = await response.json();
    document.getElementById('bill-section').style.display = 'none';
    document.getElementById('success-section').style.display = 'flex';
    document.getElementById('success-message').textContent =
    `Thank you ${currentOrder.shop_name}! Your order of ${currentOrder.total_packets} packets has been placed. Total: ${currentOrder.total_price.toLocaleString()} ETB. We will deliver to ${currentOrder.location}.`;

    loadOrders();
}

// ─── CANCEL / NEW ORDER ──────────────────────────────────

function cancelBill() {
    document.getElementById('bill-section').style.display = 'none';
    document.getElementById('order-form').style.display = 'flex';
}

function newOrder() {
    document.getElementById('success-section').style.display = 'none';
    document.getElementById('order-form').style.display = 'flex';
    document.getElementById('shop_name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('location').value = '';
    document.getElementById('payment_method').value = '';
    juiceList.forEach(juice => {
    sizeKeys.forEach(sizeKey => {
        document.getElementById(`qty_${juice.key}_${sizeKey}`).value = '';
        document.getElementById(`info_${juice.key}_${sizeKey}`).textContent = '';
    });
    });
    document.getElementById('total-box').style.display = 'none';
    document.getElementById('min-warning').style.display = 'none';
}

// ─── LOAD ORDERS TABLE ───────────────────────────────────

async function loadOrders() {
    const response = await fetch('/orders');
    const orders = await response.json();
    const tbody = document.getElementById('orders-body');

    tbody.innerHTML = '';
    orders.forEach(order => {
    let juicesSummary = '';
    try {
        const items = JSON.parse(order.items || '[]');
        juicesSummary = items.map(i => `${i.juice} ${i.size} ×${i.qty}pkt`).join('<br>');
    } catch {
        juicesSummary = '-';
    }

    tbody.innerHTML += `
        <tr>
        <td>${order.id}</td>
        <td>${order.shop_name}</td>
        <td>${order.phone}</td>
        <td>${order.location}</td>
        <td style="text-align:left; font-size:12px;">${juicesSummary}</td>
        <td>${order.total_packets || 0}</td>
        <td>${Number(order.total_price).toLocaleString()} ETB</td>
        <td>${order.payment_method}</td>
        <td class="${order.status === 'Pending' ? 'status-pending' : 'status-confirmed'}">
            ${order.status}
        </td>
        <td>${order.order_date}</td>
        </tr>
    `;
    });
}

// ─── GPS LOCATION ────────────────────────────────────────

function getLocation() {
    const btn = document.getElementById('location-btn');
    const status = document.getElementById('location-status');
    const locationInput = document.getElementById('location');

    if (!navigator.geolocation) {
    status.style.display = 'block';
    status.style.color = 'red';
    status.textContent = '❌ Your browser does not support location.';
    return;
    }

    btn.textContent = '⏳ Getting your location...';
    btn.disabled = true;
    status.style.display = 'block';
    status.style.color = '#888';
    status.textContent = 'Please allow location access...';

    navigator.geolocation.getCurrentPosition(
    async (position) => {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        status.textContent = '🔄 Converting to address...';
        try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${currentLat}&lon=${currentLng}&format=json`
        );
        const data = await res.json();
        locationInput.value = data.display_name || `${currentLat}, ${currentLng}`;
        status.style.color = 'green';
        status.textContent = '✅ Location detected!';
        btn.textContent = '📍 Location Detected ✅';
        } catch {
        locationInput.value = `${currentLat}, ${currentLng}`;
        status.style.color = 'green';
        status.textContent = '✅ Location saved!';
        btn.textContent = '📍 Location Detected ✅';
        }
        btn.disabled = false;
    },
    () => {
        btn.textContent = '📍 Use My Current Location';
        btn.disabled = false;
        status.style.color = 'red';
        status.textContent = '❌ Could not get location. Please enter manually.';
    }
    );
}

// ─── ADD JUICE SECTION STYLES TO CSS ─────────────────────

loadOrders();