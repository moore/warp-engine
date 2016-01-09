
import {Cap} from "./Cap";
import {WarpDisplay} from "./WarpDisplay";
import {Store} from "./Store";
import {User} from "./User";
import {Editor} from "./Editor";
import {Draft} from "./Draft";
import {Ui} from "./Ui";
import {Controler} from "./Controler";

import {EventType, AppState, StartState, EditorMode, StateType} from "./AppState";

export module App  {


    export interface App {
	update( state: AppState ): void ;
    }


    function startApp ( controler: Controler.Controler<EventType>, store: Store.Store, capString: string ): void {
	let cap: Cap.Cap;

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
        let capString    = location.hash.slice( 1 );

	let fStore   = Store.factory( )

	let fEditor  = Editor.factory( fControler, root, '' );
	let fDisplay = WarpDisplay.factory( fControler, root );
	let fUi      = Ui.factory( fControler, root, fEditor );



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
		    fStore.load( cap ).then( loadResult );
		}
            });
	    
            //document.location.reload();
	    function loadResult ( data ) {
		let draft  = Draft.fromString( data.Data );
		fControler.accept( EventType.ReceivedDoc, draft );
            }

        }


	startApp( fControler, fStore, capString );

        return self;


	function update ( state: AppState ): void {

	    changed( state, 'cap', ( ) => {
		location.hash = state.cap.toString( ) 
	    } );

	    changed( state, 'user', ( ) => {
		fUi.update( state );
		state.user.save( fStore );
	    } );


	    changed( state, 'endInfo', ( ) => {
		fDisplay.setPaletMode( state.endInfo );
	    } );

	    changed( state, 'draft', ( ) => {
		var draftData = state.draft.getData();

		fDisplay.draw( draftData );

		// BOOG should we really be setting code every time hear?
		fEditor.setContents( draftData.code );

		if ( state.state === StateType.Ready && fState.draft !== undefined )
		    save( state.cap, state.draft );
	    } );

	    if ( fState.log !== state.log )
		fEditor.setCaptiansLog( state.log );


	    fState = state;

	}


	function changed ( state, key, action ) {
	    if ( state[key] !== undefined && state[key] !== fState[key] )
		action();
	}
	
        function save ( cap, draft ) {
	    let draftString = draft.toString();
	    let draftData   = draft.getData();
	    let serial      = draftData.serial;
	    let dataType    = 'DraftStruct';

            fStore.save( cap, serial, dataType, draftString )
		.then( handleSaveResult )
		.catch( ( data ) => console.log( "save error: ", data ) ) //BUG: tell user
		;
        }

	function handleSaveResult ( result ) {
	    if ( result.ok === true ) {
		// BUG: Sent saved status
	    }

	    else if ( result.data.code === 'serial' ) {
		fUi.alert( "The draft appears to be open in another tab.\n"
				      + "Try switching to other tab or reloading to "
				      + "allow editing." );
	    }
		
	}

    } 


}
