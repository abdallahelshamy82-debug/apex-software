const http = require('http');

function postLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getClientData(email) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:3000/api/client/data?email=${encodeURIComponent(email)}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
  });
}

async function test() {
  console.log('--- Testing Logins ---');

  const admin1 = await postLogin('abdallahelshamy82@gmail.com', '123456');
  console.log('Admin 1 Login:', admin1.status, admin1.data?.user ? { email: admin1.data.user.email, role: admin1.data.user.role, fullName: admin1.data.user.fullName } : admin1.data);

  const client = await postLogin('auabdullah973@gmail.com', '123456');
  console.log('Client Login:', client.status, client.data?.user ? { email: client.data.user.email, role: client.data.user.role, fullName: client.data.user.fullName } : client.data);

  const clientPortal = await getClientData('auabdullah973@gmail.com');
  console.log('Client Portal Data Status:', clientPortal.status);
  if (clientPortal.data?.client) {
    console.log('Project Name:', clientPortal.data.client.projectName);
    console.log('Progress:', clientPortal.data.client.projectProgress);
    console.log('Tasks Count:', clientPortal.data.tasks?.length);
    console.log('Invoices Count:', clientPortal.data.invoices?.length);
  }
}

test();
