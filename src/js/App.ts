
import {Cap} from "./Cap";
import {WarpDisplay} from "./WarpDisplay";
import {Store} from "./Store";
import {User} from "./User";
import {Editor} from "./Editor";
import {Draft} from "./Draft";
import {Ui} from "./Ui";
import {Controler} from "./Controler";

import {EventType, AppState, StartState, EditorMode, EndInfo, StateType} from "./AppState";

export module App  {


    export interface App {
	update( state: AppState ): void ;
    }


    function startApp ( controler: Controler.Controler<EventType>, store: Store.Store, userCap: Cap.Cap, capString: string ): void {

        if ( capString === '' )
	    Cap.newCap( ).then( ( cap ) => {
		let draft = Draft.newDraft( );
		controler.accept( EventType.ReceivedCap, cap );
		controler.accept( EventType.ReceivedDoc, draft );
	    });

        else 
	    Cap.capFromString( capString )
	    .then(
		( cap ) => {
		    controler.accept( EventType.ReceivedCap, cap );

		    store.load( cap )
			.then( ( response ) => {
			    let draft  = Draft.fromString( response.data.Data );
			    controler.accept( EventType.ReceivedDoc, draft );
			})
			.catch( ( error ) => {
			    controler.accept( EventType.InvalidCap, error )
			} );
		} )
	    .catch(
		( error ) => {
		    controler.accept( EventType.InvalidCap, error ) 
		} );
	

	// BUG: this should not be async and should match draft API
	User.factory( userCap, store )
	    .then( updateUser )
	    .catch( ( err ) => console.log( "load user error:", err, userCap ) )
	;

	return;

	function updateUser ( data ) {
	    controler.accept( EventType.ReceivedUser, data );
        }

        function loadResult ( response ) {
        }

    }



    function getUserCap ( ): Promise<Cap.Cap> {

	let capString = localStorage.getItem( 'UserCap' );
	
        if ( capString !== null )
	    return Cap.capFromString( capString ).then( ( cap ) => {
		if ( cap === undefined )
		    return Promise.reject( capString );

		return cap;
	    });

	else
	    return Cap.newCap( ).then( ( cap ) => {
		localStorage.setItem( 'UserCap', cap.toString() );
		return cap;
            });
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

	let fCapString;



	fControler.subscribe( self );


        // BUG: We should make this not force reload, but we
        // will have to make sure we are reseting state properly.
        window.onhashchange = function () {
	    capString  = location.hash.slice( 1 );
	    
	    if ( capString === fCapString )
		return;

	    let oldState = <AppState>fControler.reset( );

	    Cap.capFromString( capString ).then( ( cap ) => {
		
		if ( cap === undefined )
		    fControler.accept( EventType.InvalidCap, capString );

		else {
		    if ( oldState.user !== undefined )
			fControler.accept( EventType.ReceivedUser, oldState.user );

		    fControler.accept( EventType.ReceivedCap, cap );
		    fStore.load( cap )
			.then( loadResult )
			.catch( ( error ) => console.log( "error in load: ", error ) )
		    ;
		}
            });
	    
	    return ;
            function loadResult ( response ) {
		let draft: Draft.Draft;

		if ( response.code === 'no-record' )
		    draft = Draft.newDraft( );

		else if ( response.code === 'ok' )
		    draft  = Draft.fromString( response.data.Data );

		else
		    return Promise.reject( response );

		fControler.accept( EventType.ReceivedDoc, draft );
            }

        }


	getUserCap( ).then( ( userCap ) => {
	    startApp( fControler, fStore, userCap, capString );
	} );

        return self;


	function update ( state: AppState ): void {
	    
	    if ( state.state === StateType.Error ) {
		fState = <AppState>fControler.reset( );
		return;
	    }
	    

	    changed( state, 'cap', ( ) => {
		fCapString = state.cap.toString( );
		location.hash = fCapString;
	    } );

	    changed( state, 'user', ( ) => {
		fUi.update( state );
		state.user.save( fStore );
	    } );


	    changed( state, 'endInfo', ( ) => {
		fDisplay.setPaletMode( state.endInfo );
	    } );

	    if ( state.cap !== undefined ) {

		if ( state.cap.isRead( ) !== true ) 
		    fUi.hideEditor( false );

		else {
		    fDisplay.setPaletMode( EndInfo.Counts );
		    fUi.hideEditor( true );
		}
		
	    }

	    changed( state, 'draft', ( ) => {
		var draftData = state.draft.getData();

		fDisplay.draw( draftData );

		// BUG: should we really be setting code every time hear?
		fEditor.setContents( draftData.code );
		fEditor.setReadOnly( state.cap.isRead( ) );

		if ( state.state === StateType.Ready && fState.draft !== undefined ) {
		    state.draft.save( state.cap, fStore )
			.then( handleSaveResult )
			.catch( ( data ) => console.log( "save error: ", data ) )
			    ;
		}
	    } );

	    if ( fState.log !== state.log )
		fEditor.setCaptiansLog( state.log );


	    fState = state;

	}


	function changed ( state, key, action ) {
	    if ( state[key] !== undefined && state[key] !== fState[key] )
		action();
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
