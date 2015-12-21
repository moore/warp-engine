/// <reference path="./Cap.ts" />
/// <reference path="./WarpDisplay.ts" />
/// <reference path="./Store.ts" />
/// <reference path="./User.ts" />
/// <reference path="./Editor.ts" />
/// <reference path="./Sandbox.ts" />
module App  {

    export interface App {
    }


    export function factory ( root : any ) : App {

        var fCapString = location.hash.slice(1);
	var fCap;

	if ( fCapString !== '' ) 
            fCap = Cap.capFromString( fCapString );

	else {
	    fCap = Cap.newCap();
	    location.hash = fCap.toString();
	}

	
	if ( fCap === undefined ) {
	    console.log( "could not get cap!" );
	    return undefined;
	}
	

        var fWarpStruct = {
            threads : [],
            colors  : [],
        };

        var fWarpDisplay = WarpDisplay.factory( root );
        var fStore       = Store.factory( );
	var fUser        = User.factory( );
	var fEditor      = Editor.factory( root, '' );
	var fSandbox     = Sandbox.factory( root );

	fUser.addDocument( "Untitled Document", fCap );

	console.log( 'History: ', fUser.getHistory() );

	var fCaptainsLogElm = root.getElementById("captains-log");

	initIde( );
        initMenu( root, fEditor );

        var self = {};

        return self;
	

	function initIde ( ) {
            fStore.load( fCap ).then( loadResult );

            setTimeout(resizeEditor, 0);
            window.onresize = resizeEditor;

            var paletteModeSelector = root.getElementById("palette-mode");
            paletteModeSelector.onchange = paletteModeSelect;


            var showLogCheckbox = root.getElementById("show-log");
            showLogCheckbox.onchange = displayLog;

            var drawButton = root.getElementById("draw");
            drawButton.onclick = drawWarp;

	    return;

            function paletteModeSelect () {
		fWarpDisplay.setPaletMode( paletteModeSelector.value );
            }

            function displayLog () {
		var showLog = showLogCheckbox.checked;
		if (showLog) {
                    fCaptainsLogElm.style.display = "block";    
		}
		else {
                    fCaptainsLogElm.style.display = "none";
		}
		resizeEditor();
            }
	}


	function loadResult ( data ) {
            fEditor.setContents( data.Data );
            drawWarp();
	}

	function drawWarp ( ) {
            var code = fEditor.getContents();

	    fSandbox.evaulate( code )
		.then( function ( result: Sandbox.SandboxResult ) {
		    fWarpDisplay.draw( result );
		    fCaptainsLogElm.value = result.captainsLog;
		    fStore.save( fCap, code );
		} )
		.catch( function ( error: Sandbox.SandboxError ) {
		    if ( error.cancled === true )
			console.log( "evaluation cancled becouse: '%s'", error.reason );
		    else
			fCaptainsLogElm.value = error.reason;
		    
		} );
	}


	function resizeEditor () {
            var editor = <HTMLElement>document.querySelector(".CodeMirror");
            var editorPosition = editor.getBoundingClientRect();
            var bodyMargin = +(getComputedStyle(document.body).marginBottom.slice(0, -2));
            editor.style.height = (window.innerHeight - editorPosition.top - bodyMargin) + "px";
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
}
