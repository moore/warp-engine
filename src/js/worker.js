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
