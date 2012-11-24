var fs = require('fs');
var jscoverage = require('jscoverage');
var cr = require('complexity-report');
var q = require('queue-flow');
var require = jscoverage.require(module);
var parallel = require('../lib/parallel-queue-flow', true);

exports.parallel = function(test) {
	test.expect(4);
	test.ok(!!parallel());
	test.ok(!!parallel(3));
	test.ok(!!(new parallel(3)()));
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
