import {Controler} from "./Controler";
import {User} from "./User";
import {EventType, AppState} from "./AppState";
import {Draft} from "./Draft";
import {Cap} from "./Cap";

export module Ui {

    export interface Ui {
	hideEditor( hide: boolean ): void;
	updateHistory( user:User.User ): void ;
	update( state: any ): void ;
	alert( message: string ): void ;
    }


    export function factory ( fControler: Controler.Controler<EventType>, root, editor ): Ui  {
        var fOpenButton      = root.querySelector( ".side-menu-open" );
        var fCloseButton     = root.querySelector( ".side-menu-close" );
        var fSideMenu        = root.querySelector( ".side-menu" );
        var fEditorSelector  = root.querySelector( "#editor-mode" );
	var fEditorContainer = root.querySelector( "#code-editor" );
        var fHistory         = root.querySelector( ".history" );
        var fNewDraft        = root.querySelector( ".new-draft" );
        var fCopyDraft       = root.querySelector( ".copy-draft" );
        var fShareDraft      = root.querySelector( ".share-draft" );
	var fClickCatcher    = root.querySelector( ".click-catcher" );
	var fAlertBox        = root.querySelector( ".alert-box" );
	var fUser            = undefined;
        var fTitleDiv        = <HTMLElement>root.querySelector( ".draft-title" );
	var fTitle           = fTitleDiv.innerText;
	var fShareLink       = undefined;
	var fCatcherCallback = undefined;

        fTitleDiv.addEventListener("blur", handleBlur, true);

        fOpenButton.onclick      = handleOpen;
        fCloseButton.onclick     = handleClose;
        fEditorSelector.onchange = editorSelect;
	fNewDraft.onclick        = handleNewDraft;
	fCopyDraft.onclick       = handleCopyDraft;
	fShareDraft.onclick      = handleShareDraft;
	fClickCatcher.onclick    = handleClickCatcher;


        var self = {
	    hideEditor    : hideEditor,
            updateHistory : updateHistory,
	    update        : update,
	    alert         : alert,
        };

        return self;

	function handleBlur ( event ) {
	    fControler.accept( EventType.SetTitle, fTitleDiv.innerText );
        }

	function update( state: any ): void {

	    if ( state.cap !== undefined )
		fShareLink = makeShareLink( state.cap );

	    if ( state.user !== fUser ) {
		fUser = state.user;
		if ( fUser !== undefined )
		    updateHistory( fUser );
	    }

	    if ( state.draft !== undefined ) {
		let draftData = state.draft.getData();

		if ( draftData.title !== fTitle ) {
		    fTitle = draftData.title;
		    fTitleDiv.innerText = fTitle;
		}
	    }
	}


	function hideEditor ( hide: boolean ): void {
	    if ( hide === true )
		fEditorContainer.classList.add( 'hidden' );

	    else 
		fEditorContainer.classList.remove( 'hidden' );
	}


	function alert ( message: string ): void {
	    fCatcherCallback = closeAlert;
	    fClickCatcher.classList.remove( 'hidden' );
	    fAlertBox.classList.remove( 'hidden' );
	    fAlertBox.innerHTML = "";
	    let text  = document.createTextNode( message );

	    fAlertBox.appendChild( text );
	}

	function handleClickCatcher ( ) {
	    console.log( "click" );
	    fClickCatcher.classList.add( 'hidden' );

	    if ( fCatcherCallback !== undefined )
		fCatcherCallback();

	    fCatcherCallback = undefined;
	}


	function handleNewDraft ( ) {
	    let oldState = <AppState>fControler.reset( );

	    Cap.newCap( ).then( ( cap ) => {
		let draft = Draft.newDraft( );
		fControler.accept( EventType.StartFromCap, cap );
		fControler.accept( EventType.ReceivedDoc, draft );
		// BUG: dose not check if users is undefined
		fControler.accept( EventType.ReceivedUser, oldState.user );
            });

	}


	function handleCopyDraft ( ) {
	    let oldState = <AppState>fControler.reset( );

	    Cap.newCap( ).then( ( cap ) => {
		// BUG: dose not check if draft is undefined
		let title = oldState.draft.getData().title + " (copy)";
		let draft = oldState.draft.setTitle( title );
		fControler.accept( EventType.StartFromCap, cap );
		fControler.accept( EventType.ReceivedDoc, draft );
		// BUG: dose not check if users is undefined
		fControler.accept( EventType.ReceivedUser, oldState.user );
            });
	}

	
	function handleShareDraft ( ) {
	    fCatcherCallback = closeAlert;
	    fClickCatcher.classList.remove( 'hidden' );
	    fAlertBox.classList.remove( 'hidden' );
	    fAlertBox.innerHTML = "";
	    let text  = document.createTextNode( "This link will grant read only access to the draft." );
	    let input = document.createElement( 'input' );
	    input.value = fShareLink;
	    input.classList.add( 'share-link-input' );

	    fAlertBox.appendChild( text );
	    fAlertBox.appendChild( input );
	}

	function closeAlert ( ) {
	    fAlertBox.classList.add( 'hidden' );
	}

	function makeShareLink ( cap: Cap.Cap ) {
	    let href = document.location.href;
	    let hash = href.indexOf('#');
	    let base = href.slice(0,hash);
	    let capStr = cap.toRead().toString();

	    return href.slice(0,hash) + "#" + capStr;
	}


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
