var fs = require('fs');
var cr = require('complexity-report');
var q = require('queue-flow');
var jscoverage = require('jscoverage');
jscoverage.enableCoverage(true);
var parallel = jscoverage.require(module, '../lib/parallel-queue-flow');

exports.parallel = function(test) {
	test.expect(4);
	test.ok(!!parallel());
	test.ok(!!parallel(3));
    var p3 = parallel(3);
    var p = new p3();
    test.ok(!!p.on);
	test.ok(!!q(undefined, parallel(3)).map);
	test.done();
};

exports.map = function(test) {
	test.expect(1);
	q([1, 2, 3, 4, 5, 6, 7, 8, 9], parallel(3))
		.map(function(val, callback) {
			setTimeout(callback.bind(this, val*2), Math.random()*100);
		})
		.toArray(function(arr) {
			test.equal([2, 4, 6, 8, 10, 12, 14, 16, 18].toString(), arr.toString());
			test.done();
		});
};

exports.testParallelClosing = function(test) {
    test.expect(1);
    q(['.'], parallel(4))
        .node(fs.readdir, 'error')
        .flatten().close()
        .map(function(val, callback) {
            setTimeout(callback.bind(this, val), 20 * Math.floor(Math.random()*11));
        })
        .map(function(filename) {
            return ['./' + filename, 'utf8'];
        })
        .toArray(function(result) {
            test.ok(result instanceof Array);
            test.done();
        });
};

exports.unnamedQueueProperlyClosed = function(test) {
    test.expect(3);
    var cmd = {test1: "value1", test2: "value2"};

    q([cmd, cmd, cmd, cmd], parallel(4))
        .node(function(c, cb){
            setTimeout(function(){
                cb(null, c);
            }, 1000);
        }, 'error')
        .node(function(c, cb){
            setTimeout(function(){
                cb(null, c);
            }, 1000);
        }, 'error')
        .node(function(c, cb){
            setTimeout(function(){
                cb(null, c);
            }, 1000);
        }, 'error')
        .toArray(function(result) {
            test.ok(result instanceof Array, 'received an array as expected');
            test.equal(result.length, 4, 'received all 4 "cmd" objects');
            test.equal(result[0], cmd, 'the array has the original "cmd" object in it');
            test.done();
        });
};

exports.jscoverage = function(test) {
	test.expect(1);
	var file, tmp, source, total, touched;
	for (var i in _$jscoverage) {
		test.ok(true, 'only one file tested by jscoverage');
		file = i;
		tmp = _$jscoverage[i];
		source = _$jscoverage[i].source;
		total = touched = 0;
		for (var n=0,len = tmp.length; n < len ; n++){
			if (tmp[n] !== undefined) {
				total ++ ;
				if (tmp[n] > 0) {
					touched ++;
				} else {
					console.log(n + "\t:" + source[n-1]);
				}
			}
		}
		// To be re-enabled in the future
		//test.equal(total, touched, 'All lines of code touched by test suite');
	}
	test.done();
};

exports.complexity = function(test) {
	test.expect(1);
	test.ok(70 <= cr.run(fs.readFileSync('./lib/parallel-queue-flow.js', 'utf8')).maintainability, 'parallel-queue-flow is not considered overly complex');
	test.done();
};
