import {Cap} from "./Cap";
import {User} from "./User";
import {DraftStruct} from "./Draft";
import {ObjectHelpers} from "./ObjectHelpers";
import {Controler} from "./Controler";

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
    DraftChanged,
    RuntimeError,
    NewDraft,
    CopyDraft,
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

export interface AppStruct {
    user       : User.User;
    draft      : DraftStruct;
    log        : string;
    editorMode : EditorMode;
    endInfo    : EndInfo;
}



export type AppState     = Controler.State<StateType,EventType,AppStruct>;
export type AppControler = Controler.Controler<StateType,EventType,AppStruct>;

export module ErrorState {
    export function make ( log: string ) : AppState {
        return Controler.makeState(
            StateType.Error, accptor, { 
	        user       : undefined,
	        draft      : undefined,
	        log        : log,
	        editorMode : EditorMode.Default,
	        endInfo    : EndInfo.Indexes,
            } );
    }

    function accptor ( state: StateType, struct: AppStruct, event: EventType, data: any ): AppState {

	return undefined;
    }
}


export module StartState {
    export function make ( ): AppState {
        return Controler.makeState(
            StateType.Start, accptor, { 
	        user       : undefined,
	        draft      : undefined,
	        log        : undefined,
	        editorMode : undefined,
	        endInfo    : undefined,
	    } );
    } 

    function accptor ( state: StateType, struct: AppStruct, event: EventType, data: any ): AppState {

	if ( event === EventType.ReceivedUser )
	    struct = ObjectHelpers.update( struct, { user: data } );

	else if ( event === EventType.DraftChanged )
	    struct = ObjectHelpers.update( struct, { draft: data } );

	else if ( event === EventType.InvalidCap )
	    return ErrorState.make( <string>data );

	else
	    console.log( "undexpected event: ", event, data );
	
	if ( struct.draft !== undefined
             && struct.draft.cap !== undefined 
	     && struct.user !== undefined
	     && struct.draft.doc !== undefined )
	    return ReadyState.make( struct.user, struct.draft );


        return Controler.makeState( state, accptor, struct ); 
    }

}


export module ReadyState {
    export function make ( user: User.User, draft: DraftStruct ) : AppState 
    {
	user = user.addDocument( draft.doc.title, draft.cap );

        return Controler.makeState(
            StateType.Ready, accptor, { 
	    user       : user,
	    draft      : draft,
	    log        : undefined,
	    editorMode : EditorMode.Default,
	    endInfo    : EndInfo.Indexes,
	    } );
    }

    function accptor ( state: StateType, struct: AppStruct, event: EventType, data: any ): AppState {

	if ( event === EventType.RuntimeError ) 
	    struct = ObjectHelpers.update( struct, { log: data } );

        else if ( event === EventType.DraftChanged ) {
            
            let user = struct.user;

            if ( data !== undefined && data.doc !== undefined && data.cap !== undefined ) 
                user = user.addDocument( data.doc.title, data.cap );

	    struct = ObjectHelpers.update( struct, { user: user, draft: data } );
        }

	else {
	    console.log( "undexpected event: ", event, data );
	}

        return Controler.makeState( state, accptor, struct ); 
    }
}
