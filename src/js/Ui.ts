import {Controler} from "./Controler";
import {User} from "./User";
import {EventType, AppState} from "./AppState";
import {Draft} from "./Draft";
import {Cap} from "./Cap";

export module Ui {

    export interface Ui {
	updateHistory( user:User.User ): void ;
	update( state: any ): void ;
    }


    export function factory ( controler: Controler.Controler<EventType>, root, editor ): Ui  {
        var fOpenButton     = root.querySelector( ".side-menu-open" );
        var fCloseButton    = root.querySelector( ".side-menu-close" );
        var fSideMenu       = root.querySelector( ".side-menu" );
        var fEditorSelector = root.querySelector("#editor-mode" );
        var fHistory        = root.querySelector( ".history" );
        var fNewDraft       = root.querySelector( ".new-draft" );
        var fCopyDraft      = root.querySelector( ".copy-draft" );
        var fShareDraft     = root.querySelector( ".share-draft" );
	var fUser           = undefined;
        var fTitleDiv       = <HTMLElement>root.querySelector( ".draft-title" );
	var fTitle          = fTitleDiv.innerText;

        fTitleDiv.addEventListener("blur", handleBlur, true);

        fOpenButton.onclick      = handleOpen;
        fCloseButton.onclick     = handleClose;
        fEditorSelector.onchange = editorSelect;
	fNewDraft.onclick        = handleNewDraft;
	fCopyDraft.onclick       = handleCopyDraft;
	fShareDraft.onclick      = handleShareDraft;

        var self = {
            updateHistory : updateHistory,
	    update        : update,
        };

        return self;

	function handleBlur ( event ) {
	    controler.accept( EventType.SetTitle, fTitleDiv.innerText );
        }

	function update( state: any ): void {

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

	function handleNewDraft ( ) {
	    let oldState = <AppState>controler.reset( );

	    Cap.newCap( ).then( ( cap ) => {
		let draft = Draft.newDraft( );
		controler.accept( EventType.StartFromCap, cap );
		controler.accept( EventType.ReceivedDoc, draft );
		// BUG: dose not check if users is undefined
		controler.accept( EventType.ReceivedUser, oldState.user );
            });

	}


	function handleCopyDraft ( ) {
	    let oldState = <AppState>controler.reset( );

	    Cap.newCap( ).then( ( cap ) => {
		// BUG: dose not check if draft is undefined
		let title = oldState.draft.getData().title + " (copy)";
		let draft = oldState.draft.setTitle( title );
		controler.accept( EventType.StartFromCap, cap );
		controler.accept( EventType.ReceivedDoc, draft );
		// BUG: dose not check if users is undefined
		controler.accept( EventType.ReceivedUser, oldState.user );
            });
	}

	
	function handleShareDraft ( ) {
	    let href = document.location.href;
	    let hash = href.indexOf('#');
	    let base = href.slice(0,hash);
	    alert( "Not implmented yet :(" );
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
