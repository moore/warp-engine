var KEY_LENGTH = 15;


var warpDisplay = initWarpDispaly( document );
var ide         = initIde( document, warpDisplay );

var menu = initMenu( document, ide );


function initWarpDispaly ( root ) {
    
    var container = root.getElementById("code-output");
    var canvas    = root.getElementById("canvas");
    var ctx       = canvas.getContext("2d");
    var palette   = root.getElementById("color-palette");
    var warpEnds  = document.getElementById("warp-ends");

    var warpDisplay =  {
	draw         : draw,
	setPaletMode : setPaletMode,
    }

    return warpDisplay;

    function draw ( warp ) {
	var threads = warp.threads;
	var colors  = warp.colors;
	
	var threadWidth;
	var warpWidth;

	if (threads.length === 0) {
            warpWidth = 400;
	} else if (threads.length < 400) {
            threadWidth = Math.ceil(400 / threads.length);
            warpWidth = threadWidth * threads.length;
	} else {
            threadWidth = 1;
            warpWidth = threads.length;
	}

	canvas.width = warpWidth;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for ( var i = 0 ; i < threads.length ; i++ ) {
            var offset = i * threadWidth;

            ctx.fillStyle = colors[ threads[ i ] ];
            ctx.fillRect( offset, 0, threadWidth, canvas.height );
	}                 
	
	container.style.width = ((warpWidth + 2) + "px");
	updateWarpCount( threads );
	buildPalette(warp.colors, warp.threads);
    }

    function updateWarpCount ( threads ) {
	warpEnds.innerHTML = "";

	var warpEndCount = document.createTextNode("total warp ends: " + threads.length);
	warpEnds.appendChild(warpEndCount);     
    }

    function buildPalette ( colors, threads ) {
	
	var colorCounts = [];

	for (var i = 0; i < colors.length; i ++)
            colorCounts[i] = 0;

	for (var i = 0; i < threads.length; i ++)
            colorCounts[threads[i]]++;

	palette.innerHTML = "";

	for (var i = 0; i < colors.length; i ++) {
            
            var colorDiv = document.createElement("div");
            var colorIndex = document.createTextNode(i);
            var indexSpan = document.createElement("span");
            var colorCount = document.createTextNode(colorCounts[i]);
            var countSpan = document.createElement("span");
            var colorSwatch = document.createElement("div");

            colorDiv.classList.add("color-div");
            colorSwatch.classList.add("color-swatch");
            indexSpan.classList.add("color-index");
            countSpan.classList.add("color-count");

            colorSwatch.style.backgroundColor = colors[i];
            
            indexSpan.appendChild(colorIndex);
            countSpan.appendChild(colorCount);
            colorDiv.appendChild(indexSpan);
            colorDiv.appendChild(countSpan);
            colorDiv.appendChild(colorSwatch);
            palette.appendChild(colorDiv);
	}
    }

    function setPaletMode ( mode ) {
	if ( mode === "palette-by-index") {
            palette.classList.add("show-index");
            palette.classList.remove("show-count");
	} else {
            palette.classList.add("show-count");
            palette.classList.remove("show-index");
	}
    }

}


function initIde ( root, warpDisplay ) {

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
    var warpStruct = getWarpStruct();

    if ( warpStruct !== undefined )
	load( warpStruct ).then( loadResult );
    else {
	warpStruct = makeWarpStruct();
	setLocation( warpStruct );
	// Probbly should just have a default ID to fetch
	code = 'colors  = [ "LightCoral", "Plum", "SeaGreen" ];\nthreads = [ ];\n\nfor (var i = 0; i < 100; i++ )\n  for ( var j = 0 ; j < 3 ; j++ )\n    threads.push(j);';
}


    var captainsLogElm = root.getElementById("captains-log");

    var editor = CodeMirror( codeMirrorDiv, {
	value : code,
	mode:  "javascript",
	keyMap: "vim",
	lineNumbers: true,
    });

    setTimeout(resizeEditor, 0);
    window.onresize = resizeEditor;

    drawWarp( );


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
		      
		      save( warpStruct, code );
		      warpDisplay.draw( warpStruct );
		  }
	      }
	  });
    }
    
    function drawWarp ( ) {
	var code = editor.getValue();

	captainsLog = "";
	var threads = [];
	var colors  = [];

	sandbox.contentWindow.postMessage(code, "*");

	/*
	eval( code );

	warpStruct.threads   = threads;
	warpStruct.colors    = colors;
	captainsLogElm.value = captainsLog;
	
	save( warpStruct, code );
	
	warpDisplay.draw( warpStruct );
	*/
    }
    
    function loadResult ( data ) {
	editor.setValue( data.Data );
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
	var editor = document.querySelector(".CodeMirror");
	var editorPosition = editor.getBoundingClientRect();
	var bodyMargin = +(getComputedStyle(document.body).marginBottom.slice(0, -2));
	editor.style.height = (window.innerHeight - editorPosition.top - bodyMargin) + "px";
    }

    function setLocation ( warpStruct ) {
	var encodedKey = encodeKey( warpStruct.key );
	location.hash = warpStruct.mode + ":" + encodedKey;
    }

    function getWarpStruct ( ) {

	if ( location.hash == '' )
	    return undefined;

	var warpCap = location.hash.slice(1);

	var parts = warpCap.split(":");
	
	var mode = parts[0];
	var key  = decodeKey( parts[1] );

	var warpStruct = {
	    key  : key,
	    mode : mode,
	};

	return warpStruct;
    }

    function decodeKey ( encodedKey ) {
	var keyBytes = atob( encodedKey );
	var keyBuf   = stringToUint8( keyBytes );

	return keyBuf;
    }

    function encodeKey ( keyBuf ) {
	var keyBytes   = uint8ToString( keyBuf );
	var encodedKey =  btoa( keyBytes );

	return encodedKey;
    }

    function makeWarpStruct ( ) {
	var buf        = new ArrayBuffer( KEY_LENGTH );
	var uint8Array = new Uint8Array( buf );
	
	window.crypto.getRandomValues( uint8Array );

	var warpStruct = {
	    mode : "edit",
	    key  : buf,
	};

	return warpStruct;
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
		return hash.slice( 0, KEY_LENGTH );
	    });
    }

    function save ( warpStruct, code ) {
	
	if ( warpStruct.mode !== 'edit' )
	    return;
	
	var preimage  = warpStruct.key;
	editToGetKey( preimage )
	    .then( function ( key ) {

		var url = "/set";
		
		var request = {
		    Preimage : encodeKey( preimage ),
		    Key      : encodeKey( key ),
		    DataType : "JavaScript",
		    Data     : code,
		}

		console.log( "share: read:%s", request.Key ); //BOOG
		
		fetch(url, {  
		    method: 'post',  
		    headers: {  
			"Content-type": "application/json; charset=UTF-8"  
		    },  
		    body: JSON.stringify(request)
		})
		    .then(json)  
		    .then(function (data) {  
			console.log('Request succeeded with JSON response', data);  
		    })  
		    .catch(function (error) {  
			console.log('Request failed', error);  
		    });

		function json(response) {  
		    return response.json()  
		} 
	    });
    }

    function load ( warpStruct ) {
	
	var url = "/get";

	var result;

	if ( warpStruct.mode === 'edit' )
	    result = editToGetKey( warpStruct.key )
	    .then( doLoad );

	else {
	    result = doLoad( warpStruct.key );
	}

	return result;

	function doLoad ( loadKey ) {
	    var request = {
		Key : encodeKey( loadKey ),
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

