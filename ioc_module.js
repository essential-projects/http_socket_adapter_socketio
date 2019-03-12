'use strict';

const SocketioHttpSocketAdapter = require('./dist/commonjs/index').SocketioHttpSocketAdapter;
const socketAdapterDiscoveryTag = require('@essential-projects/http_contracts').socketAdapterDiscoveryTag;

function registerInContainer(container) {

  container.register('SocketioHttpSocketAdapter', SocketioHttpSocketAdapter)
    .dependencies('container', 'IdentityService')
    .configure('http:http_extension')
    .singleton()
    .tags(socketAdapterDiscoveryTag);
}

module.exports.registerInContainer = registerInContainer;
