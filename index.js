'use strict'
/*
 Hides away all the junk of creating an Proxy Protocl Compatible SPDY-ied HTTP server

 DOES NOT SUPPORT TLS/SSL stuff yet as we don't need it and it's pretty easy to that without
 this library (or at least better documented.

 You need to be using at least node4+. might work on node >0.10 to <4 but not tested

*/

const http    = require('http');
const spdy    = require('spdy');
const proxywrap = require('findhit-proxywrap');


module.exports = function createServer(opts, requestListener){

    let server;

    opts = opts || {};

    //TODO:
    // make strict mode configurable
    // make spdy opts configurable
    
    const useProxyProtocol = opts.proxyprotocol === true ? true : false;
    const isSpdy = opts.spdy === true ? true : false;

    // TODO: is it even possible to have a non-plain but ssl-less connection?
    // surely ALPN/NPN only works via TLS?
    const spdyOpts = {
        plain: true,
        ssl: false
    }

    if(isSpdy && useProxyProtocol ) {
      /*
        We create this wierd object because:
        (this applies for spdy v2+)
        - proxywrap.proxy() uses server.Server as a base, where server is the first argument
        - spdy.Server is actually an https server
        - spdy.PlainServer is a plain http server
       */
        const base = {
            Server: spdy.server.PlainServer
        };
        
        // NOTE: this needs some serious work...
        // we are re-adding info proxywrap parsed from proxyprotocol headers if spdy connection
        // because spdy hides underlying TCP connection
        //   req.connection !== req.spdyStream.connection.socket
        const wrappedRequestListener = function(req, res){
            // NOTE: we overwrite remote address which means we lose the IP:PORT which
            // the loadbalancer initiated the connection from
            // ProxyAddress/Port refer to interface the loadbalancer accepted the 
            // connection on
            
            // If we recieve non-spdy/http2 traffic whilst in spdy/http2 mode it will actually
            // be a normal stream
            if(req.isSpdy){
                // NOTE: values from remoteAddress/Port maybe be affected by proxywraps 'remoteOverride'
                // option
                defineRemoteAddress(req.connection, req.spdyStream.connection.socket);
                defineRemotePort(req.connection, req.spdyStream.connection.socket);
                defineClientAddress(req.connection, req.spdyStream.connection.socket);
                defineClientPort(req.connection, req.spdyStream.connection.socket);
                defineProxyAddress(req.connection, req.spdyStream.connection.socket);
                defineProxyPort(req.connection, req.spdyStream.connection.socket);
            }
            requestListener(req, res)
        }

        const proxiedHttp = proxywrap.proxy(base, {strict: false});
        server = proxiedHttp.createServer({spdy: spdyOpts}, wrappedRequestListener)
    }
    
    if(isSpdy && !useProxyProtocol) {
        server = spdy.createServer({spdy: spdyOpts}, requestListener);
    }

    if(!isSpdy && useProxyProtocol) {
        const proxiedHttp = proxywrap.proxy(http, {strict: false});
        server = proxiedHttp.createServer(requestListener)
    }

    if(!isSpdy && !useProxyProtocol){
        server = http.createServer(requestListener);
    }

    return server;

}

/**
 * Taken from proxywrap as we need to ce-copy/define these on the request handler/listener
 * or each request as SPDY doesn't use/care/understand abput proxrwrap underneath and req.connection
 * doesn't directly map to the underlying tcp connection
 */

function defineRemoteAddress(socket, realSocket){
  Object.defineProperty(socket, 'remoteAddress', {
    enumerable: false,
    configurable: true,
    get: function() {
      return realSocket.remoteAddress;
    }
  });
}

function defineRemotePort(socket, realSocket){
  Object.defineProperty(socket, 'remotePort', {
    enumerable: false,
    configurable: true,
    get: function() {
      return realSocket.remotePort
    }
  });
}

function defineClientAddress(socket, realSocket){
  Object.defineProperty(socket, 'clientAddress', {
    enumerable: false,
    configurable: true,
    get: function() {
      return realSocket.clientAddress
    }
  });
}

function defineClientPort(socket, realSocket){
  Object.defineProperty(socket, 'clientPort', {
    enumerable: false,
    configurable: true,
    get: function() {
      return realSocket.clientPort
    }
  });
}

function defineProxyAddress(socket, realSocket){
  Object.defineProperty(socket, 'proxyAddress', {
    enumerable: false,
    configurable: true,
    get: function() {
      return realSocket.proxyAddress
    }
  });
}

function defineProxyPort(socket, realSocket){
  Object.defineProperty(socket, 'proxyPort', {
    enumerable: false,
    configurable: true,
    get: function() {
      return realSocket.proxyPort
    }
  });
}