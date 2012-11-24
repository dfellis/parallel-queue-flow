// parallel-queue-flow Copyright (C) 2012 by David Ellis
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// The `parallel-queue-flow` constructor constructor function function :)
function parallel(parallelism) {
	if(!parallelism) parallelism = Infinity;
	function parallelQ(nameOrArray) {
		this.qType = parallelQ;

		// Private variables
		var eventHandlers = {};
		var queue = [];
		var handler = undefined;
		var openQueue = [];

		// Priviledged methods

		// `on` registers event handlers
		this.on = function on(eventName, handler) {
			eventHandlers[eventName] = eventHandlers[eventName] instanceof Array ? eventHandlers[eventName] : [];
			eventHandlers[eventName].push(handler);
			return this;
		};

		// `fire` executes the event handlers, passing along whatever arguments given to it
		// minus the event name indicator, of course. If any handler returns false, it indicates
		// so, indiating to the method firing the event to cancel.
		this.fire = function fire(eventName) {
			var newArgs = Array.prototype.slice.call(arguments, 1, arguments.length-1);
			var callback = arguments[arguments.length-1] instanceof Function ? arguments[arguments.length-1] : function() {};
			if(!eventHandlers) {
				callback(false);
			} else if(eventHandlers[eventName]) {
				var total = eventHandlers[eventName].length, count = 0, finalResult = true;
				eventHandlers[eventName].forEach(function(newArgs, handler) {
					if(!handler instanceof Function) return count++;
					if(parallelQ.q.isAsync(handler, newArgs.length+1)) {
						newArgs.push(function(result) {
						if(result === false) finalResult = result;
							count++;
							if(total == count) callback(finalResult);
						});
						handler.apply(this, newArgs);
					} else {
						var result = handler.apply(this, newArgs);
						if(result === false) finalResult = result;
						count++;
						if(total == count) callback(finalResult);
					}
				}.bind(this, newArgs));
			} else {
				callback(true);
			}
		}.bind(this);

		// `clear` clears all event handlers from the specified event
		this.clear = function clear(eventName) {
			eventHandlers[eventName] = [];
		};

		// `setHandler` defines the special function to call to process the queue
		// assumed to be ready initially, when called marked busy, call provided callback to
		// mark ready again.
		this.setHandler = function setHandler(handlerFunc) {
			handler = handlerFunc;
			//handler = handlerFunc(openQueueStruct.inValue, handlerCallback.bind(this, openQueueStruct));
			if(queue && queue.length > 0) this.push();
			return this;
		};

		// The `handlerCallback` is provided to the handler along with the dequeued value.
		// If there is more work to be done, it continues, otherwise is marks the handler
		// as ready for when the data next arrives
		var handlerCallback = function handlerCallback(openQueueStruct, done) {
			openQueueStruct.done = done;
			var currStruct = openQueue[0];
			while(!!currStruct && currStruct.done instanceof Function) {
				currStruct.done();
				openQueue.shift();
				currStruct = openQueue[0];
			}
			if(openQueue.length == 0 && queue.length == 0) {
				this.fire('empty');
			} else {
				this.push();
			}
		}.bind(this);

		var enqueueItems = function enqueueItems() {
			var numToProcess = (parallelism - openQueue.length) > queue.length ? queue.length : parallelism - openQueue.length;
			for(var i = 0; i < numToProcess; i++) {
				var value = queue[0];
				this.fire('pull', value, function(result) {
					if(result) {
						// Javascript treats assignments of objects as pass-by-reference,
						// so this seemingly unnecessary single-property object allows
						// alteration of the correct value in the openQueue array without
						// creating an explicit id
						var openQueueStruct = {
							value: value,
							done: false
						};
						openQueue.push(openQueueStruct);
						process.nextTick(handler.bind(this, queue.shift(), handlerCallback.bind(this, openQueueStruct)));
					}
				}.bind(this));
			}
		}.bind(this);

		// Inserts a specified value into the queue, if allowed by the event handlers, and
		// calls the special handler function, if it's ready.
		this.push = function push() {
			var values = Array.prototype.slice.call(arguments, 0);
			this.fire('push', values, function(result) {
				if(result === false) return;
				if(!!handler && openQueue.length < parallelism) {
					queue.push.apply(queue, values);
					enqueueItems();
				} else {
					queue.push.apply(queue, values);
				}
			}.bind(this));
			return this;
		};

		// Signals that the queue is being destroyed and then, if allowed, destroys it
		this.close = function close() {
			this.fire('close', function(result) {
				if(result) {
					// Stop accepting new items so the queue can actually close
					// if processing time is slower than newly enqueued values come in
					this.clear('push');
					this.on('push', function() { return false; });
					// Whatever made it into the queue at this point in time, allow it to be
					// processed and de-queued.
					var flushQueue = function() {
						var tempHandler = handler;
						handler = undefined;
						eventHandlers = undefined;
						queue = undefined;
						if(this.namedQueues) Object.keys(this.namedQueues).forEach(function(queue) {
							if(this.namedQueues[queue] === this) delete this.namedQueues[queue];
						}.bind(this));
						delete this;
						if(tempHandler instanceof Function) {
							process.nextTick(tempHandler.bind(null, 'close'));
						}
					}.bind(this);
					if(queue && !queue.length) process.nextTick(flushQueue.bind(this));
					if(queue && queue.length) {
						this.clear('empty');
						this.on('empty', flushQueue.bind(this));
					}
				}
			}.bind(this));
			return this;
		}.bind(this);

		//  Kills the queue (and all sub-queues) immediately, no possibility of blocking
		// with an event handler.
		this.kill = function kill() {
			this.fire('kill');
			var tempHandler = handler;
			handler = undefined;
			eventHandlers = {};
			queue = undefined;
			if(this.namedQueues) Object.keys(this.namedQueues).forEach(function(queue) {
				if(this.namedQueues[queue] === this) delete this.namedQueues[queue];
			}.bind(this));
			delete this;
			if(tempHandler instanceof Function) {
				tempHandler('kill');
			}
		};

		// Start processing the queue after the next JS event loop cycle and return the queue
		// object to the remaining code.
		if(nameOrArray instanceof Array) {
			this.push.apply(this, nameOrArray);
			if(queue.length > 0) this.on('empty', this.close.bind(this));
		}
		return this;
	}
	if(module && module.exports) {
		// If in a CommonJS environment like Node.js, grab the
		// queue-flow prototype via a require statement, except
		// if queue-flow has been added to the global scope (for
		// those who want to guarantee that
		// `q('someQueue') instanceof q.Q` is true
		var q = global.q && !!q ? q : require('queue-flow');
		parallelQ.prototype = q.Q.prototype;
		parallelQ.q = q;
	} else {
		// Otherwise assume it's already been defined in scope
		// and attach the prototype that way
		parallelQ.prototype = q.Q.prototype;
		parallelQ.q = q;
	}
	return parallelQ;
}

if(module && module.exports) {
	module.exports = parallel;
}
