var assert = require('assert');

var factory = require('../');

assert.doesNotThrow(function(){
    var server = factory();
})
