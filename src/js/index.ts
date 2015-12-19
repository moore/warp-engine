/// <reference path="typings/codemirror/codemirror.d.ts" />
/// <reference path="typings/whatwg-fetch/whatwg-fetch.d.ts" />
/// <reference path="./Cap.ts" />
/// <reference path="./WarpDisplay.ts" />


var app = AppFactory( document );


/////// App Module //////

function AppFactory ( root ) {
    return initApp( root );
}

function initApp ( root ) {
    var fCapString = location.hash.slice(1);

    var fCap         = Cap.CapFactory( fCapString );
    var fWarpDisplay = WarpDisplay.factory( root );
    var fStore       = initStore( );
    var fIde         = initIde( root, fCap, fStore, fWarpDisplay );

    var fMenu = initMenu( root, fIde );

    var self = {};

    return self;
}


/////// Ide Module /////////

function initIde ( root, fCap, fStore, warpDisplay ) {

    var ide = {
	setEditorMode : setEditorMode,

    };

    var drawButton = root.getElementById("draw");
    drawButton.onclick = drawWarp;

    var paletteModeSelector = root.getElementById("palette-mode");
    paletteModeSelector.onchange = paletteModeSelect;


    var showLogCheckbox = root.getElementById("show-log");
    showLogCheckbox.onchange = displayLog;

    
    var sandbox = root.querySelector( ".sandbox" );

    initSandbox( sandbox );
    
    var codeMirrorDiv = root.getElementById("code-mirror");
    var code = "";

    fStore.load( fCap ).then( loadResult );

    var captainsLogElm = root.getElementById("captains-log");

    var editor = CodeMirror( codeMirrorDiv, {
	value : code,
	mode:  "javascript",
	keyMap: "vim",
	lineNumbers: true,
    });

    setTimeout(resizeEditor, 0);
    window.onresize = resizeEditor;

    var warpStruct = {
	threads : [],
	colors  : [],
    };

    return ide;

    function initSandbox ( sandbox ) {

	window.addEventListener('message',
          function (event) {
	      // Sandboxed iframes which lack the 'allow-same-origin'
	      // header have "null" rather than a valid origin. This means you still
	      // have to be careful about accepting data via the messaging API you
	      // create. Check that source, and validate those inputs!
	      if (event.source === sandbox.contentWindow) {

		  var result = event.data;

		  if ( result.error !== undefined ) 
		      captainsLogElm.value = result.error;

		  else {
		      warpStruct.threads   = result.threads;
		      warpStruct.colors    = result.colors;
		      captainsLogElm.value = result.captainsLog;

		      var code = result.code;
		      
		      fStore.save( fCap, code );
		      warpDisplay.draw( warpStruct );
		  }
	      }
	  });
    }
    
    function drawWarp ( ) {
	var code = editor.getDoc().getValue();

	captainsLogElm.value = "";
	var threads    = [];
	var colors     = [];

	sandbox.contentWindow.postMessage(code, "*");
    }
    
    function loadResult ( data ) {
	editor.getDoc().setValue( data.Data );
	drawWarp();
    }

    
    function paletteModeSelect () {
	warpDisplay.setPaletMode( paletteModeSelector.value );
    }

    function setEditorMode ( mode ) {
	if (mode === "vim") {
            editor.setOption("keyMap", "vim");
	} else {
            editor.setOption("keyMap", "default");
	}
    }

    function displayLog () {
	var showLog = showLogCheckbox.checked;
	if (showLog) {
            captainsLogElm.style.display = "block";    
	}
	else {
            captainsLogElm.style.display = "none";
	}
	resizeEditor();
    }


    function resizeEditor () {
	var editor = <HTMLElement>document.querySelector(".CodeMirror");
	var editorPosition = editor.getBoundingClientRect();
	var bodyMargin = +(getComputedStyle(document.body).marginBottom.slice(0, -2));
	editor.style.height = (window.innerHeight - editorPosition.top - bodyMargin) + "px";
    }

    function setLocation ( warpStruct ) {
	location.hash = fCap.toString();
    }
}

function initStore ( ) {

    var store = {
	save : save,
	load : load,
    };

    return store;


    function save ( cap, code ) {
	
	if ( cap.getMode() !== 'edit' )
	    return;
	
	cap.toRead()
	    .then( function ( readCap ) {
		var preimage  = cap.getKey();
		var key       = readCap.getKey();

		var url = "/set";
		
		var request = {
		    Preimage : preimage,
		    Key      : key,
		    DataType : "JavaScript",
		    Data     : code,
		}

		return fetch(url, {  
		    method: 'post',  
		    headers: {  
			"Content-type": "application/json; charset=UTF-8"  
		    },  
		    body: JSON.stringify(request)
		})
		    .then(json)  
		    .then(function (data) {  
			return Promise.resolve( data );
		    })  
		    .catch(function (error) {  
			console.log('Request failed', error);
			return Promise.reject( undefined );
		    });

		function json(response) {  
		    return response.json()  
		} 
	    });
    }

    function load ( cap ) {
	
	var url = "/get";

	var result;

	if ( cap.getMode() === 'edit' )
	    result = cap.toRead()
	      .then( doLoad );

	else {
	    result = doLoad( cap );
	}

	return result;

	function doLoad ( readCap ) {
	    var request = {
		Key : readCap.getKey(),
	    }


	    return fetch(url, {  
		method: 'post',  
		headers: {  
		    "Content-type": "application/json; charset=UTF-8"  
		},  
		body: JSON.stringify(request) })
		.then(json);  
	    
	    function json(response) {  
		return response.json()  
	    }
	}
	
    }

    

}



function initMenu ( root, ide ) {
    var fOpenButton     = root.querySelector( ".side-menu-open" );
    var fCloseButton    = root.querySelector( ".side-menu-close" );
    var fSideMenu       = root.querySelector( ".side-menu" );
    var fEditorSelector = root.getElementById("editor-mode");

    fOpenButton.onclick      = handleOpen;
    fCloseButton.onclick     = handleClose;
    fEditorSelector.onchange = editorSelect;


    return {};

    function handleOpen ( ) {
	fSideMenu.classList.add( 'open-state' );
    }

    function handleClose ( ) {
	fSideMenu.classList.remove( 'open-state' );
    }
    
    function editorSelect () {
	var mode = fEditorSelector.value;
	ide.setEditorMode( mode );
    }

}

///////// future Cap module //////////////
/*
function CapFactory ( capString ) {
    var fCapStruct
    
    if ( capString === undefined )
	fCapStruct = makeCap();

    else
	fCapStruct = parseCap( capString );

    if ( fCapStruct === undefined )
	return undefined;

    return initCap( fCapStruct );
}

function initCap ( fCapStruct ) {

    var self = {
	toRead    : toRead,
	getKey    : getKey,
	getMode   : getMode,
	toString  : toString,
    }

    return  self;
    
    function toRead ( ) {
	if ( fCapStruct.mode === 'read' )
	    return Promise.resolve( self );

	return editToGetKey( fCapStruct.key ).then( function ( readKey ) {
	    return Promise.resolve( initCap( { mode : 'read', key : readKey } ) );
	});
    }

    function getKey ( ) {
	return encodeKey( fCapStruct.key );
    }

    function getMode ( ) {
	return fCapStruct.mode;
    }

    function toString ( ) {
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
*/
