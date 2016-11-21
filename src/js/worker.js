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
    shafts = 4;
    treadles = 6;
    threading = [];
    weftThreads = [];
    treadling = [];
    tieup = [];

    try {
        eval( event.data );
        result.threads     = threads;
        result.colors      = colors;
        result.shafts      = shafts;
        result.treadles    = treadles;
        result.threading   = threading;
        result.weftThreads = weftThreads;
        result.treadling   = treadling;
        result.tieup       = tieup;
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

function pointReflect (array) {
      return array.concat(array.slice(0, -1).reverse());
}

function plus (x, y) {
      if (y < 0)
              return minus(x, Math.abs(y));
        if ((x < 1) || (x > 8))
                log("unexpected value for x: " + x);
          return (x + y - 1) % 8 + 1;
}

function minus (x, y) {
      if ((x < 1) || (x > 8))
              log("unexpected value for x: " + x);
        return ( (x - 1) + ( 8 - y % 8 ) )% 8 + 1;
}

function collapse (line, shafts) {
      var result = [];
        for (var i = 0; i < line.length; i++) {
                result.push(((line[i]-1) % shafts) + 1);
                  }
          return result;
}

function logWif () {

    log("Version=1.1\nSource Program=WarpEngine\nSource Version=1.0\nDate=December 4, 2015\n");
  
    log("[CONTENTS]");
    log("WEAVING=1");
    log("COLOR PALETTE=1");
    log("COLOR TABLE=1");
    log("WARP=1");
    log("WEFT=1");
    log("THREADING=1");
    log("WARP COLORS=1");
    log("TREADLING=1");
    log("WEFT COLORS=1");
    log("TIEUP=1");
    log("\n");

    log("[WEAVING]");
    log("Rising Shed=1");
    log("Shafts=" + shafts);
    log("Treadles=" + treadles);
    log("\n");

    log("[COLOR PALETTE]");
    log("Entries=" + colors.length);
    log("Range=0,255");
    log("\n");

    log("[COLOR TABLE]");
    for (i=0; i < colors.length; i++)
        log((i+1) + "=" + hexToRgb(colors[i]));
    log("\n");

    log("[WARP]");
    log("Threads=" + threads.length);
    log("\n");

    log("[WEFT]");
    log("Threads=" + treadling.length);
    log("\n");

    log("[THREADING]");
    for (i=0; i < threading.length; i++)
        log((i+1) + "=" + threading[i]);
    log("\n");
    
    log("[WARP COLORS]");
    for (i=0; i < threads.length; i++)
        log((i+1) + "=" + (threads[i] + 1));
    log("\n");

    log("[TREADLING]");
    for (i=0; i < treadling.length; i++)
        log((i+1) + "=" + treadling[i]);
    log("\n");

    log("[WEFT COLORS]");
    for (i=0; i < weftThreads.length; i++)
        log((i+1) + "=" + (weftThreads[i] + 1));
    log("\n");

    log("[TIEUP]");
    for (i=0; i < tieup.length; i++)
        log((i+1) + "=" + tieup[i].join());

}

function hexToRgb(hex) {
    var rgb = [];
    rgb.push(parseInt(hex.slice(1,3), 16));
    rgb.push(parseInt(hex.slice(3,5), 16));
    rgb.push(parseInt(hex.slice(5), 16));
    return rgb.join();
}
