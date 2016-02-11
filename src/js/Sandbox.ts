export module Sandbox {

    export interface SandboxResult {
	code    : string;
	threads : Array<number>;
        colors  : Array<number>;
        log     : string;
    }

    export interface SandboxError {
	cancled : boolean;
	reason  : string;
    }

    export interface Sandbox {
        evaulate( code : string ) : Promise<SandboxResult> ;

    }

    export function factory ( root ): Sandbox {

	var self = {
	    evaulate : evaulate,
	}

	var fResolve;
	var fReject;

        var sandbox = root.querySelector( ".sandbox" );
	initSandbox( sandbox );

	return self;


        function initSandbox ( sandbox ) {

            window.addEventListener('message',
              function (event) {
                  // Sandboxed iframes which lack the 'allow-same-origin'
                  // header have "null" rather than a valid origin. This means you still
                  // have to be careful about accepting data via the messaging API you
                  // create. Check that source, and validate those inputs!
                  if (event.source === sandbox.contentWindow) {

                      var result = event.data;
                      console.log( "result: ", result );
                      if ( result.error !== undefined ) 
                          error( result.error );

                      else if ( fResolve !== undefined ) {
			  var sResult: SandboxResult = {
			      code    : result.code,
                              threads : result.threads,
                              colors  : result.colors,
                              log     : result.captainsLog,
			  };
			  
			  fResolve( sResult );
                      }

		      fResolve = undefined;
		      fReject  = undefined;
                  }
              });
        }

	function cancle ( reason: string ) : void {
	    doReject( true, reason );
	}

	function error ( reason: string ) : void {
	    doReject( false, reason );
	}

	function doReject ( cancled: boolean, reason: string ) : void {
	    var error: SandboxError = {
		cancled : cancled,
		reason  : reason,
	    };

	    fReject( error );
	    fReject = undefined;
	}

	function evaulate ( code : string ) {
	    if ( fReject !== undefined )
		cancle( 'new request' );

	    return new Promise ( function ( resolve, reject ) {
		sandbox.contentWindow.postMessage(code, "*");
		fResolve = resolve;
		fReject  = reject;
	    } );
	}

    }

}
