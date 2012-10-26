var jscoverage = require('jscoverage');
var require = jscoverage.require(module);
var q = require('queue-flow');
var parallel = require('../lib/parallel-queue-flow', true);

exports.tempTest = function(test) {
    test.done();
};
