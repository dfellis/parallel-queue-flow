# parallel-queue-flow

[![Build Status](https://secure.travis-ci.org/dfellis/parallel-queue-flow.png?branch=master)](https://travis-ci.org/dfellis/parallel-queue-flow)

## Like [sloppy-queue-flow](https://github.com/dfellis/sloppy-queue-flow), but better!

parallel-queue-flow is a [queue-flow](http://dfellis.github.com/queue-flow) constructor function that alters the queue-flow semantics to allow your processing steps to run in "parallel". Specifically, execute multiple calls to your processing steps in the Javascript event loop, so if your code is mostly calling external resources (AJAX calls, Node FS or HTTP calls, etc), then you will get a performance boost.

This is like sloppy-queue-flow, but unlike sloppy-queue-flow, parallel-queue-flow lets you specify how many concurrent calls you want at a time (perhaps limit it to 4 calls per step), *and* it keeps queue ordering intact, so you can be sure reducing functions like ``reduce`` and ``toArray`` always return the same results for a given data set no matter what kind of reducer function you provide it (with sloppy-queue-flow, ``toArray`` is effectively broken, and ``reduce`` only works with commutative functions).

## Usage

For details on how to use queue-flow generally, see the [main queue-flow website](http://dfellis.github.com/queue-flow).

``parallel-queue-flow`` is a replacement constructor function for queue-flow, and to use in Node.js code, simply:

```js
var q = require('queue-flow');
var parallel = require('parallel-queue-flow');

q('parallelQueue', parallel(4))
    ... //Your code here
```

``parallel`` is a function that returns a constructor that runs your queue with the specified level of parallelism. If you pass in the function directly without calling it, instead it will create a "greedy" parallel queue that enqueues all incoming data to be processed immediately just like sloppy-queue-flow, but keeps track of queue ordering.

## License (MIT)

Copyright (C) 2012 by David Ellis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
