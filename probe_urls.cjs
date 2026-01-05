
const http = require('http');

const host = 'erp-simpleit.sytes.net';
const port = 8051;
const paths = [
  '/wsProcess/IwsProcess.svc',
  '/ws/IwsProcess.svc',
  '/TOTVSBusinessConnect/wsProcess/IwsProcess.svc',
  '/wsDataServer/IwsDataServer.svc',
  '/wsProcess/IwsProcess.svc?wsdl',
  '/IwsProcess.svc'
];

paths.forEach(path => {
  const options = {
    hostname: host,
    port: port,
    path: path,
    method: 'HEAD'
  };

  const req = http.request(options, (res) => {
    console.log(`${path}: ${res.statusCode}`);
  });

  req.on('error', (e) => {
    console.error(`${path}: Error - ${e.message}`);
  });

  req.end();
});
