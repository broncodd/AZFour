var express = require('express');
var proxy = require('http-proxy-middleware');

var app = express();
app.use(express.static('./'))
app.use('/api/000001', proxy({target: 'http://localhost:9001', changeOrigin: true, ignorePath:true, logLevel: 'debug'}));
app.use('/api/000003', proxy({target: 'http://localhost:9003', changeOrigin: true, ignorePath:true, logLevel: 'debug'}));
app.use('/api/000005', proxy({target: 'http://localhost:9005', changeOrigin: true, ignorePath:true, logLevel: 'debug'}));
app.use('/api/000007', proxy({target: 'http://localhost:9007', changeOrigin: true, ignorePath:true, logLevel: 'debug'}));
app.use('/api/000010', proxy({target: 'http://localhost:9010', changeOrigin: true, ignorePath:true, logLevel: 'debug'}));
app.use('/api/000020', proxy({target: 'http://localhost:9020', changeOrigin: true, ignorePath:true, logLevel: 'debug'}));
app.use('/api/000050', proxy({target: 'http://localhost:9050', changeOrigin: true, ignorePath:true, logLevel: 'debug'}));

app.listen(8000);
