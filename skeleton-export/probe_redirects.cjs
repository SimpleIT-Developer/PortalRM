
const http = require('http');

const host = 'erp-simpleit.sytes.net';
const port = 8051;
const paths = [
  '/wsProcess/IwsProcess.svc?wsdl',
  '/ws/IwsProcess.svc',
  '/TOTVSBusinessConnect/wsProcess/IwsProcess.svc'
];

paths.forEach(path => {
  const options = {
    hostname: host,
    port: port,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`${path}: ${res.statusCode}`);
    if (res.statusCode >= 300 && res.statusCode < 400) {
        console.log(`  -> Redirect to: ${res.headers.location}`);
    }
    
    let data = '';
    res.on('data', (chunk) => {
        if (data.length < 100) data += chunk;
    });
    res.on('end', () => {
        console.log(`  Content: ${data.substring(0, 100).replace(/\n/g, ' ')}...`);
    });
  });

  req.on('error', (e) => {
    console.error(`${path}: Error - ${e.message}`);
  });

  req.end();
});
