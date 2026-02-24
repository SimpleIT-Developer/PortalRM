
const http = require('http');

const host = 'erp-simpleit.sytes.net';
const port = 8051;
const path = '/wsProcess/IwsProcess.svc';

const options = {
  hostname: host,
  port: port,
  path: path,
  method: 'GET' // Trying GET to see headers
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.end();
