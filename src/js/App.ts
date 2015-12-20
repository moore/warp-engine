/// <reference path="./Cap.ts" />
/// <reference path="./WarpDisplay.ts" />
/// <reference path="./Ide.ts" />
/// <reference path="./Store.ts" />
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
	    

        var fWarpDisplay = WarpDisplay.factory( root );
        var fStore       = Store.factory( );
        var fIde         = Ide.factory( root, fCap, fStore, fWarpDisplay );

        var fMenu = initMenu( root, fIde );

        var self = {};

        return self;
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
