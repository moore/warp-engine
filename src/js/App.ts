
import {Cap} from "./Cap";
import {WarpDisplay} from "./WarpDisplay";
import {Store} from "./Store";
import {User} from "./User";
import {Editor} from "./Editor";
import {Sandbox} from "./Sandbox";
import {Draft} from "./Draft";
import {Ui} from "./Ui";
import {Controler} from "./Controler";

import {EventType, AppState, StartState, EndInfo, EditorMode, StateType} from "./AppState";

export module App  {

    interface AppComponents {
	root    : HTMLElement;
	store   : Store.Store;
	display : WarpDisplay.Display;
	editor  : Editor.Editor;
	sandbox : Sandbox.Sandbox;
	ui      : Ui.Ui; 
    }

    export interface App {
	update( state: AppState ): void ;
    }

    function makeAppComponents ( controler: Controler.Controler<EventType>, root : HTMLElement ) : AppComponents {
	let editor = Editor.factory( controler, root, '' )

	let components = {
	    root   : root,
	    store  : Store.factory( ),
	    display: WarpDisplay.factory( controler, root ),
	    editor : editor,
	    sandbox: Sandbox.factory( root ),
	    ui     : Ui.factory( controler, root, editor ), // BUG: this should not take editor
	};
	
	return components;
    }

    function startApp ( controler: Controler.Controler<EventType>, components: AppComponents, capString: string ): void {
	let cap: Cap.Cap;

	let store = components.store;

        let fUserCap = "BOOG";

        if ( capString === '' )
	    Cap.newCap( ).then( ( cap ) => {
		let draft = Draft.newDraft( );
		controler.accept( EventType.StartFromCap, cap );
		controler.accept( EventType.ReceivedDoc, draft );

		// BUG: this should not be async and should match draft API
		User.factory( fUserCap )
		    .then( updateUser );

            });

        else 
	    Cap.capFromString( capString ).then( ( cap ) => {

		if ( cap === undefined )
		    controler.accept( EventType.InvalidCap, capString );

		else {
		    controler.accept( EventType.StartFromCap, cap );
		    store.load( cap ).then( loadResult );
		    
		    User.factory( fUserCap )
			.then( updateUser );

		}
	    });



	return;

	function updateUser ( data ) {
	    controler.accept( EventType.ReceivedUser, data );
        }

        function loadResult ( data ) {
	    let draft  = Draft.fromString( data.Data );
	    controler.accept( EventType.ReceivedDoc, draft );
        }

    }


    export function factory ( root : HTMLElement ) : App {

        var self = {
	    update : update,
	};

	let fState       = StartState.make( );
	let fControler   = Controler.factory( fState );
	let fComponents  = makeAppComponents( fControler, root );
        let capString    = location.hash.slice( 1 );

	fControler.subscribe( self );


        // BUG: We should make this not force reload, but we
        // will have to make sure we are reseting state properly.
        window.onhashchange = function () {
	    capString    = location.hash.slice( 1 );
	    let oldState = <AppState>fControler.reset( );

	    Cap.capFromString( capString ).then( ( cap ) => {
		
		if ( cap === undefined )
		    fControler.accept( EventType.InvalidCap, capString );

		else {
		    fControler.accept( EventType.StartFromCap, cap );
		    fControler.accept( EventType.ReceivedUser, oldState.user );
		    fComponents.store.load( cap ).then( loadResult );
		}
            });
	    
            //document.location.reload();
	    function loadResult ( data ) {
		let draft  = Draft.fromString( data.Data );
		fControler.accept( EventType.ReceivedDoc, draft );
            }

        }

        var fCaptainsLogElm = <HTMLInputElement>root.querySelector("#captains-log");

        initIde( );

	startApp( fControler, fComponents, capString );

        return self;


	function update ( state: AppState ): void {

	    changed( state, 'cap', ( ) => {
		location.hash = state.cap.toString( ) 
	    } );

	    changed( state, 'user', ( ) => {
		fComponents.ui.update( state );
		state.user.save( fComponents.store );
	    } );


	    changed( state, 'endInfo', ( ) => {
		fComponents.display.setPaletMode( state.endInfo );
	    } );

	    changed( state, 'draft', ( ) => {
		var draftData = state.draft.getData();

		fComponents.display.draw( draftData );

		// BOOG should we really be setting code every time hear?
		fComponents.editor.setContents( draftData.code );
	    } );

	    if ( fState.log !== state.log )
		fCaptainsLogElm.value = state.log;

	    fState = state;

	    if ( state.state === StateType.Ready )
		save( state.cap, state.draft );
	}


	function changed( state, key, action ) {
	    if ( state[key] !== undefined && state[key] !== fState[key] )
		action();
	}

        function initIde ( ) {

            setTimeout(resizeEditor, 0);
            window.onresize = resizeEditor;

            var paletteModeSelector = <HTMLInputElement>root.querySelector("#palette-mode");
            paletteModeSelector.onchange = paletteModeSelect;


            var showLogCheckbox = <HTMLInputElement>root.querySelector("#show-log");
            showLogCheckbox.onchange = displayLog;

            var drawButton = <HTMLElement>root.querySelector("#draw");
            drawButton.onclick = runCode;

            return;

            function paletteModeSelect () {
		let mode: EndInfo;
		let modeString: string = paletteModeSelector.value;

		if ( modeString === 'palette-by-index' )
		    mode = EndInfo.Indexes;
		else
		    mode = EndInfo.Counts

		fControler.accept( EventType.PalettModeSelect, mode );
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

	
        function save ( cap, draft ) {
            // BUG: we are not acutally storing js any more
	    let draftString = draft.toString();
	    let draftTitle  = draft.getData().title;

            fComponents.store.save( cap, draftString );
        }

        function runCode ( ) {
            var code = fComponents.editor.getContents();

            fComponents.sandbox.evaulate( code )
                .then( function ( result: Sandbox.SandboxResult ) {
		    fControler.accept( EventType.UpdateDraft, result );
                } )
                .catch( function ( error: Sandbox.SandboxError ) {
                    if ( error.cancled === true )
                        console.log( "evaluation cancled becouse: '%s'", error.reason );
                    else
			fControler.accept( EventType.RuntimeError, error );
                } );
        }


        function resizeEditor () {
            var editor = <HTMLElement>document.querySelector(".CodeMirror");
            var editorPosition = editor.getBoundingClientRect();
            var bodyMargin = +(getComputedStyle(document.body).marginBottom.slice(0, -2));
            editor.style.height = (window.innerHeight - editorPosition.top - bodyMargin) + "px";
        }
    } 


}
