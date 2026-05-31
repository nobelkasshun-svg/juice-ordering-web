/* eslint-disable */
const packetInfo = {
    '2 Liter': 6,
    '1 Liter': 8,
    'Half Liter': 10,
    'Quarter Liter': 12
};

document.getElementById('size').addEventListener('change', function () {
    const size = this.value;
    const info = document.getElementById('packet-info');

    if (size && packetInfo[size]) {
    info.style.display = 'block';
    info.textContent = `📦 1 Packet of ${size} = ${packetInfo[size]} bottles`;
    } else {
    info.style.display = 'none';
    }
});

async function submitOrder() {
    const shop_name = document.getElementById('shop_name').value;
    const juice_type = document.getElementById('juice_type').value;
    const size = document.getElementById('size').value;
    const quantity = document.getElementById('quantity').value;
    const message = document.getElementById('message');

    if (!shop_name || !juice_type || !size || !quantity) {
    message.style.color = 'red';
    message.textContent = '❌ Please fill in all fields!';
    return;
    }

    const bottlesPerPacket = packetInfo[size];
  const totalBottles = bottlesPerPacket * quantity;

    const response = await fetch('/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        shop_name,
        juice_type,
        size,
        quantity,
        total_bottles: totalBottles
    })
    });

    const data = await response.json();
    message.style.color = 'green';
    message.textContent = data.message;
    loadOrders();
}

async function loadOrders() {
    const response = await fetch('/orders');
    const orders = await response.json();
    const tbody = document.getElementById('orders-body');

    tbody.innerHTML = '';
    orders.forEach(order => {
    const bottles = packetInfo[order.size] * order.quantity;
    tbody.innerHTML += `
        <tr>
        <td>${order.id}</td>
        <td>${order.shop_name}</td>
        <td>${order.juice_type}</td>
        <td>${order.size}</td>
        <td>${order.quantity} packet (${bottles} bottles)</td>
        <td>${order.order_date}</td>
        </tr>
    `;
    });
}

loadOrders();