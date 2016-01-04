export module Cap  {
    var KEY_LENGTH = 15;

    export interface Cap {
	toRead()  : Cap;
	getKey()  : string;
	getMode() : string;
	toString(): string;
    }


    export function capFromString ( capString: string ) : Promise<Cap> {
	
	var fCapStruct = parseCap( capString );

	if ( fCapStruct === undefined )
	    return undefined;

	return initCap( fCapStruct );
    }

    export function newCap ( ) : Promise<Cap> {
	return initCap( makeCap() );
    }

    function initCap ( fCapStruct ): Promise<Cap> {

	var fReadCap: Cap;

	var self = {
	    toRead    : toRead,
	    getKey    : getKey,
	    getMode   : getMode,
	    toString  : toString,
	}

	return makeRead();
	
	function toRead ( ): Cap {
	    return fReadCap;
	}

	function makeRead ( ) : Promise<Cap> {
	    if ( fCapStruct.mode === 'read' ) {
		fReadCap = self;
		return Promise.resolve( self );
	    }

	    return editToGetKey( fCapStruct.key ).then( function ( readKey ) {
		return initCap( { mode : 'read', key : readKey } ).then( ( readCap ) => {
		    fReadCap = readCap;
		    return self;
		} );
	    });
	}

	function getKey ( ) {
	    return encodeKey( fCapStruct.key );
	}

	function getMode ( ) {
	    return fCapStruct.mode;
	}

	function toString ( ) {
	    // BOOG: should have version in hear!!!
	    return fCapStruct.mode + ":" + encodeKey( fCapStruct.key );
	}
	
    }

    function parseCap ( capString ) {

	var parts = capString.split(":");
	
	if ( parts.length !== 2 )
	    return undefined;

	var mode = parts[0];

	if ( mode !== 'read' && mode !== 'edit' )
	    return undefined;

	var key  = decodeKey( parts[1] );

	if ( key.byteLength !== KEY_LENGTH )
	    return undefined

	var cap = {
	    key  : key,
	    mode : mode,
	};

	return cap;
    }

    function decodeKey ( encodedKey ) {
	var keyBytes = atob( encodedKey );
	var keyBuf   = stringToUint8( keyBytes );

	return keyBuf;
    }

    function encodeKey ( keyBuf ) {
	var keyBytes   = uint8ToString( keyBuf );
	var encodedKey = btoa( keyBytes );

	return encodedKey;
    }

    function makeCap ( ) {
	var buf        = new ArrayBuffer( KEY_LENGTH );
	var uint8Array = new Uint8Array( buf );
	
	window.crypto.getRandomValues( uint8Array );

	var cap = {
	    mode : "edit",
	    key  : buf,
	};

	return cap;
    }

    function stringToUint8 ( str ) {
	var buf     = new ArrayBuffer ( str.length );
	var bufView = new Uint8Array ( buf );

	for ( var i=0 ; i < str.length ; i++ )
	    bufView[i] = str.charCodeAt(i);
	
	return buf;
    }

    function uint8ToString ( buf ) {
	var u8a = new Uint8Array( buf );
	var CHUNK_SZ = 0x8000;
	var c        = [];

	for ( var i=0 ; i < u8a.length ; i+=CHUNK_SZ ) {
	    c.push( String.fromCharCode.apply( null, u8a.subarray( i, i+CHUNK_SZ ) ) );
	}
	
	return c.join("");
    }

    function editToGetKey ( key ) {
	return crypto.subtle.digest( "SHA-256", key )
	    .then( function ( hash ) {
		return Promise.resolve( hash.slice( 0, KEY_LENGTH ) );
	    });
    }

}
