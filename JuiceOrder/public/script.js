
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
    status.textContent = 'Please allow location access when your browser asks...';

    navigator.geolocation.getCurrentPosition(
    async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        status.textContent = '🔄 Converting to address...';

        try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();

        const address = data.display_name || `${lat}, ${lng}`;
        locationInput.value = address;

        status.style.color = 'green';
        status.textContent = '✅ Location detected successfully!';
        btn.textContent = '📍 Location Detected ✅';

        } catch (error) {
        locationInput.value = `${lat}, ${lng}`;
        status.style.color = 'green';
        status.textContent = '✅ Location saved as coordinates!';
        btn.textContent = '📍 Location Detected ✅';
        }

        btn.disabled = false;
    },
        (error) => {
        btn.textContent = '📍 Use My Current Location';
        btn.disabled = false;
        status.style.color = 'red';

        if (error.code === 1) {
        status.textContent = '❌ Permission denied. Please allow location access.';
        } else if (error.code === 2) {
        status.textContent = '❌ Location not available. Enter manually.';
        } else {
        status.textContent = '❌ Could not get location. Enter manually.';
        }
    }
    );
}/* eslint-disable */
const packetData = {
    '2 Liter':    { bottles: 6,  pricePerBottle: 180, pricePerPacket: 1080 },
    '1 Liter':    { bottles: 8,  pricePerBottle: 95,  pricePerPacket: 760  },
    'Half Liter': { bottles: 10, pricePerBottle: 50,  pricePerPacket: 500  }
};

const paymentNumbers = {
    'Telebirr': '0911 234 567',
    'CBE':      '1000 234567890'
};

let currentOrder = {};

function updatePacketInfo() {
    const size = document.getElementById('size').value;
    const quantity = document.getElementById('quantity').value;
    const infoBox = document.getElementById('packet-info');
    const totalBox = document.getElementById('total-box');

    if (size && packetData[size]) {
    const data = packetData[size];
    infoBox.style.display = 'block';
    infoBox.textContent = `📦 1 Packet of ${size} = ${data.bottles} bottles = ${data.pricePerPacket} ETB`;

    if (quantity && quantity > 0) {
      const totalBottles = data.bottles * quantity;
      const totalPrice = data.pricePerPacket * quantity;
        totalBox.style.display = 'block';
        totalBox.textContent = `🧮 ${quantity} Packet(s) × ${data.pricePerPacket} ETB = ${totalPrice.toLocaleString()} ETB (${totalBottles} bottles total)`;
    } else {
        totalBox.style.display = 'none';
    }
    } else {
    infoBox.style.display = 'none';
    totalBox.style.display = 'none';
    }
}

function showBill() {
    const shop_name = document.getElementById('shop_name').value;
    const phone = document.getElementById('phone').value;
    const location = document.getElementById('location').value;
    const juice_type = document.getElementById('juice_type').value;
    const size = document.getElementById('size').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const payment_method = document.getElementById('payment_method').value;
    const message = document.getElementById('message');

    if (!shop_name || !phone || !location || !juice_type || !size || !quantity || !payment_method) {
    message.textContent = '❌ Please fill in all fields!';
    return;
    }

    message.textContent = '';
    const data = packetData[size];
  const totalBottles = data.bottles * quantity;
  const totalPrice = data.pricePerPacket * quantity;

    currentOrder = { shop_name, phone, location, juice_type, size, quantity, total_bottles: totalBottles, total_price: totalPrice, payment_method };

    document.getElementById('bill-details').innerHTML = `
    <div class="bill-row"><span>Shop Name</span><span>${shop_name}</span></div>
    <div class="bill-row"><span>Phone</span><span>${phone}</span></div>
    <div class="bill-row"><span>Location</span><span>${location}</span></div>
    <div class="bill-row"><span>Juice</span><span>${juice_type}</span></div>
    <div class="bill-row"><span>Size</span><span>${size}</span></div>
    <div class="bill-row"><span>Packets</span><span>${quantity}</span></div>
    <div class="bill-row"><span>Total Bottles</span><span>${totalBottles} bottles</span></div>
    <div class="bill-total"><span>💰 Total Price</span><span>${totalPrice.toLocaleString()} ETB</span></div>
    `;

    document.getElementById('payment-instructions').innerHTML = `
    <p>Please send <strong>${totalPrice.toLocaleString()} ETB</strong> to:</p>
    <p>📱 <strong>${payment_method}:</strong> ${paymentNumbers[payment_method]}</p>
    <p style="margin-top:8px; color:#888; font-size:13px;">After payment your order will be confirmed and delivered to your location.</p>
    `;

    document.getElementById('order-form').style.display = 'none';
    document.getElementById('bill-section').style.display = 'flex';
}

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
    `Thank you ${currentOrder.shop_name}! Your order of ${currentOrder.quantity} packet(s) of ${currentOrder.size} ${currentOrder.juice_type} has been placed. Total: ${currentOrder.total_price.toLocaleString()} ETB. We will deliver to ${currentOrder.location}.`;

    loadOrders();
}

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
    document.getElementById('juice_type').value = '';
    document.getElementById('size').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('payment_method').value = '';
    document.getElementById('packet-info').style.display = 'none';
    document.getElementById('total-box').style.display = 'none';
}

async function loadOrders() {
    const response = await fetch('/orders');
    const orders = await response.json();
    const tbody = document.getElementById('orders-body');

    tbody.innerHTML = '';
    orders.forEach(order => {
    tbody.innerHTML += `
        <tr>
        <td>${order.id}</td>
        <td>${order.shop_name}</td>
        <td>${order.phone}</td>
        <td>${order.location}</td>
        <td>${order.juice_type}</td>
        <td>${order.size}</td>
        <td>${order.quantity}</td>
        <td>${order.total_bottles}</td>
        <td>${Number(order.total_price).toLocaleString()} ETB</td>
        <td>${order.payment_method}</td>
        <td class="${order.status === 'Pending' ? 'status-pending' : 'status-confirmed'}">${order.status}</td>
        <td>${order.order_date}</td>
        </tr>
    `;
    });
}

loadOrders();