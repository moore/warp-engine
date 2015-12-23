/// <reference path="./Cap.ts" />
/// <reference path="./WarpDisplay.ts" />
/// <reference path="./Store.ts" />
/// <reference path="./User.ts" />
/// <reference path="./Editor.ts" />
/// <reference path="./Sandbox.ts" />
/// <reference path="./Draft.ts" />
module App  {

    export interface App {
    }


    export function factory ( root : any ) : App {

        var fStore     = Store.factory( );
        var fCapString = location.hash.slice(1);
	var fCap;

	if ( fCapString !== '' ) {
            fCap = Cap.capFromString( fCapString );
	    fStore.load( fCap ).then( loadResult );
	}

	else {
	    fCap = Cap.newCap();
	    location.hash = fCap.toString();
	}

	
	if ( fCap === undefined ) {
	    console.log( "could not get cap!" );
	    return undefined;
	}
	

	// BUG: We should make this not force reload, but we
	// will have to make sure we are reseting state properly.
	window.onhashchange = function () {
	    document.location.reload();
	}

        var fWarpStruct = {
            threads : [],
            colors  : [],
        };

        var fWarpDisplay = WarpDisplay.factory( root );
	var fUser        = User.factory( );
	var fEditor      = Editor.factory( root, '' );
	var fSandbox     = Sandbox.factory( root );

	var fDraft : Draft.Draft;

	var fCaptainsLogElm = root.getElementById("captains-log");
	var fTitleDiv       = root.querySelector( ".draft-title" );

	fTitleDiv.addEventListener("blur", function( event ) {
	    fDraft = fDraft.setTitle( fTitleDiv.innerText );
	    save( fCap, fDraft );
	}, true);

	initIde( );
        var fMenu = initMenu( root, fEditor );

	fMenu.updateHistory( fUser );

        var self = {};

        return self;
	

	function initIde ( ) {

            setTimeout(resizeEditor, 0);
            window.onresize = resizeEditor;

            var paletteModeSelector = root.getElementById("palette-mode");
            paletteModeSelector.onchange = paletteModeSelect;


            var showLogCheckbox = root.getElementById("show-log");
            showLogCheckbox.onchange = displayLog;

            var drawButton = root.getElementById("draw");
            drawButton.onclick = runCode;

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
	    fDraft = Draft.fromString( data.Data );
	    var draftData = fDraft.getData();

            fEditor.setContents( draftData.code );
	    fWarpDisplay.draw( draftData );
	    fUser.addDocument( draftData.title, fCap )
		.then( () => {
		    fMenu.updateHistory( fUser );
		} );
	    fTitleDiv.innerText = draftData.title;
	}

	function save ( fCap: Cap.Cap, fDraft: Draft.Draft ) {
	    // BUG: we are not acutally storing js any more
	    fStore.save( fCap, fDraft.toString() );
	    fUser.addDocument( fDraft.getData().title, fCap )
		.then( () => {
		    fMenu.updateHistory( fUser );
		} );

	}

	function runCode ( ) {
            var code = fEditor.getContents();

	    fSandbox.evaulate( code )
		.then( function ( result: Sandbox.SandboxResult ) {
		    fWarpDisplay.draw( result );
		    fCaptainsLogElm.value = result.captainsLog;
		    fDraft = fDraft.update( code, result.threads, result.colors ); 
		    save( fCap, fDraft );
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

    function initMenu ( root, editor ) {
        var fOpenButton     = root.querySelector( ".side-menu-open" );
        var fCloseButton    = root.querySelector( ".side-menu-close" );
        var fSideMenu       = root.querySelector( ".side-menu" );
        var fEditorSelector = root.getElementById("editor-mode");
	var fHistory        = root.querySelector( ".history");

        fOpenButton.onclick      = handleOpen;
        fCloseButton.onclick     = handleClose;
        fEditorSelector.onchange = editorSelect;

	var self = {
	    updateHistory : updateHistory,
	};

        return self;

        function handleOpen ( ) {
            fSideMenu.classList.add( 'open-state' );
        }

        function handleClose ( ) {
            fSideMenu.classList.remove( 'open-state' );
        }
        
        function editorSelect () {
            var mode = fEditorSelector.value;
            editor.setEditorMode( mode );
        }

	function updateHistory ( user ) {
	    let history = user.getHistory()

	    fHistory.innerHTML = "";

	    for ( let i = 0; i < history.length ; i++ )
		fHistory.appendChild( historyEntry( history[i] ) );
	}

	function historyEntry ( data ) {
	    let entry  = document.createElement("li");
	    let anchor = document.createElement("a");
	    let title  = document.createTextNode(data.title);
	    
	    let link = "#";

	    if ( data.write.length > 0 )
		link += data.write;
	    else
		link += data.read;

	    anchor.href = link;
	    anchor.appendChild( title );
	    entry.appendChild( anchor );

	    return entry;
	}
    }
}
