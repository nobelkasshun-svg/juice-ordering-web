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