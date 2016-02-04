# Silly Server Factory 

Handles (some of) the pain of creating a non-ssl proxy-protocol spdy/http2 understanding server

Read the `index.js` for docs/comments etc.

__Basics__
- Creates and returns an `http` server like thing
- Attaches the request listener for you (attaching listeners after instantion leads to duplicate requests and bad things and is totally not supported and who-knows-what unexpected behaviour may happen)
- Does not "start"/"listen" the server

## Usage
```
var factory = require('bizzby-silly-server-factory')

// This could be an express app
var myRequestHandler = function(req, res){

    if(req.isSpdy) {
        console.log('SPDY/HTTP2 request, spdyVersion %s, stream %s', req.spdyVersion, req.spdyStream.id)
    }
    
    console.log('remote IP = ' + req.connection.remoteAddress + ':' + req.connection.remotePort)
    // these will be undefined if the connection does send the proxy protocol headers
    console.log('proxy IP = ' + req.connection.proxyAddress + ':' + req.connection.proxyPort)
    console.log('client IP = ' + req.connection.clientAddress + ':' + req.connection.clientPort)

    res.writeHead(200)
    res.end('ok')
}

// Set this otherwise they default to false :-)
var someOpts = {
  proxyprotocol: true,
  spdy: true
}

var myServer = factory(someOpts, myRequestHandler).listen(9100)
```
