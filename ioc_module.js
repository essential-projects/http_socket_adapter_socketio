'use strict';

const SocketioHttpSocketAdapter = require('./dist/commonjs/index').SocketioHttpSocketAdapter;

function registerInContainer(container) {

  container.register('SocketioHttpSocketAdapter', SocketioHttpSocketAdapter)
    .dependencies('container', 'IdentityService')
    .configure('http:http_extension')
    .singleton();
}

module.exports.registerInContainer = registerInContainer;
