onmessage = receiveMessage;

function receiveMessage( event ) {
    var mainWindow = event.source;
    var result     = {
        error       : undefined,
        threads     : undefined,
        colors      : undefined,
        captainsLog : undefined,
    };

    captainsLog = "";
    threads = [];
    colors  = [];

    try {
        eval( event.data );
        result.threads     = threads;
        result.colors      = colors;
        result.captainsLog = captainsLog;
    } catch (e) {
        result.error = e.stack;
    }

    postMessage( result );
}

// BUILT IN FUNCTIONS

function log (text) {
    captainsLog += text + "\n";
}

function shuffle (array) {
    var halfLength = Math.ceil(array.length/2);
    var firstHalf = array.slice(0, halfLength);
    var lastHalf = array.slice(halfLength, array.length);
    var shuffledArray = [];

    while (firstHalf.length != 0 && lastHalf.length != 0) {
        var n = Math.random();
        if (n < 0.5) {
            shuffledArray.push(firstHalf.shift())
        } else {
            shuffledArray.push(lastHalf.shift())
        }   
    }

    return shuffledArray.concat(firstHalf.concat(lastHalf));
}

function repeat ( count, values ) {
    var result = [];

    for ( var i = 0 ; i < count ; i++ )
        result = result.concat( values );

    return result;
}

function repeatFn ( count, fn, values ) {
    var result = values;

    for ( var i = 0 ; i < count ; i++ )
        result = fn(result);

    return result;
}

function stretch ( factor, values ) {
    var result = [];

    for ( var i = 0 ; i < values.length ; i++ )
        for ( var j = 0 ; j < factor ; j++ )
            result.push( values[i] );

    return result;
}
