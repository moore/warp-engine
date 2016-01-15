import {Cap} from "./Cap";
import {User} from "./User";
import {Draft} from "./Draft";
import {Controler} from "./Controler";
import {ObjectHelpers} from "./ObjectHelpers";

export enum EventType {
    ReceivedDoc,
    ReceivedCap,
    DocSaved,
    ReceivedUser,
    UserSaved,
    ScriptResult,
    SetTitle,
    PalettModeSelect,
    InvalidCap,
    UpdateDraft,
    RuntimeError,
}

export enum EditorMode {
    Vi,
    Default,
}

export enum EndInfo {
    Indexes,
    Counts,
}

export enum StateType {
    Error,
    Start,
    Ready,
}

export interface AppState {
    state      : StateType;
    cap        : Cap.Cap;
    user       : User.User;
    draft      : Draft.Draft;
    log        : string;
    editorMode : EditorMode;
    endInfo    : EndInfo;
    accptor( controler: Controler.Controler<EventType>, state: AppState, event: EventType, data: any ): AppState; 
}


export module ErrorState {
    export function make ( log: string ) : AppState {
	return {
	    state      : StateType.Error,
	    cap        : undefined,
	    user       : undefined,
	    draft      : undefined,
	    log        : log,
	    editorMode : EditorMode.Default,
	    endInfo    : EndInfo.Indexes,
	    accptor    : accptor,
	};
    }

    function accptor ( controler: Controler.Controler<EventType>, state: AppState, event: EventType, data: any ): AppState {

	return state;
    }
}


export module StartState {
    export function make ( ): AppState {
	return {
	    state      : StateType.Start,
	    cap        : undefined,
	    user       : undefined,
	    draft      : undefined,
	    log        : undefined,
	    editorMode : undefined,
	    endInfo    : undefined,
	    accptor    : accptor,
	};
    }

    function accptor ( controler: Controler.Controler<EventType>, state: AppState, event: EventType, data: any ): AppState {

	if ( event === EventType.ReceivedCap )
	    state = ObjectHelpers.update( state, { cap: data } );

	else if ( event === EventType.ReceivedUser )
	    state = ObjectHelpers.update( state, { user: data } );

	else if ( event === EventType.ReceivedDoc )
	    state = ObjectHelpers.update( state, { draft: data } );

	else if ( event === EventType.InvalidCap )
	    state = ErrorState.make( <string>data );

	else
	    console.log( "undexpected event: ", event, data );
	
	if ( state.cap !== undefined 
	     && state.user !== undefined
	     && state.draft !== undefined )
	    state = ReadyState.make( state.cap, state.user, state.draft );

	return state;
    }

}


export module ReadyState {
    export function make ( cap: Cap.Cap, user: User.User, draft: Draft.Draft ) : AppState {

	user = user.addDocument( draft.getData().title, cap );

	return {
	    state      : StateType.Ready,
	    cap        : cap,
	    user       : user,
	    draft      : draft,
	    log        : undefined,
	    editorMode : EditorMode.Default,
	    endInfo    : EndInfo.Indexes,
	    accptor    : accptor,
	};
    }

    function accptor ( controler: Controler.Controler<EventType>, state: AppState, event: EventType, data: any ): AppState {

	if ( event === EventType.UpdateDraft ) {
            let draft = state.draft.update( data.code, data.threads, data.colors ); 
            let log   = data.captainsLog;
	    let user  = state.user.addDocument( draft.getData().title, state.cap );

	    state = ObjectHelpers.update( state, { user: user, draft: draft, log: log  } );
	}

	else if ( event === EventType.SetTitle ) {
            let draft = state.draft.setTitle( data ); 
	    let user  = state.user.addDocument( data, state.cap );

	    state = ObjectHelpers.update( state, { user: user, draft: draft } );
	}

	else if ( event === EventType.RuntimeError ) {
	    state = ObjectHelpers.update( state, { log: data  } );
	}

	else {
	    console.log( "undexpected event: ", event, data );
	}

	return state;
    }
}
