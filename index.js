/*
 Hides away all the junk of creating an Proxy Compy SPDY-ied HTTP server

 DOES NOT SUPPORT TLS/SSL stuff yet as we don't need it

*/

var http    = require('http');
var spdy    = require('spdy');
var proxywrap = require('findhit-proxywrap');


module.exports = function createServer(opts){

    var server;
    var proxiedHttp;

    var opts = opts || {};

    //TODO:
    // make strict mode configurable
    // make spdy opts configurable
    
    var useProxyProtocol = opts.proxyprotocol === true ? true : false;
    var isSpdy = opts.spdy === true ? true : false;

    var spdyOpts = {
        plain: true,
        ssl: false
    }

    if(isSpdy) {

        if(useProxyProtocol) {

            // keep a reference just in case
            spdy.server.HttpsServer = spdy.server.Server;

            // PlainServer exists in spdy 2+
            if(spdy.server.PlainServer) {
              /*
                We do hacky over-writing here because:
                (this applies for spdy v2+)
                - proxywrap uses spdy.server.Server as a base.
                - spdy.Server is actually an https server
                - spdy.PlainServer is a plain http server
               */
              spdy.server.Server = spdy.server.PlainServer;
            } else {
              spdy.server.Server = spdy.server.instantiate(http.Server);
            }

            proxiedHttp = proxywrap.proxy(spdy.server, {strict: false});
            server = proxiedHttp.createServer(spdyOpts)
        
        } else {
            server = spdy.createServer(spdyOpts);
        }

    } else {

        if(useProxyProtocol) {
            proxiedHttp = proxywrap.proxy(http, {strict: false});
            server = proxiedHttp.createServer()
        } else {
            server = http.createServer();
        }

    }

    return server;

}