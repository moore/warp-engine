import {ObjectHelpers} from "./ObjectHelpers";

export module Draft  {

    export interface DraftStruct {
	format  : number;
	serial  : number;
	title   : string;
	threads : Array<number>;
	colors  : Array<number>;
	code    : string;
    }

    export interface Draft {
	update( code: string, threads: Array<number>, colors: Array<number> ): Draft;
	setTitle( title: string ) : Draft;
	getData( ) : DraftStruct;
	toString( ) : string;
    }

    
    export function newDraft ( ) : Draft {
	var draftStruct = emptyDraft();

	return init( draftStruct );
    }


    export function fromString ( draftString : string ) : Draft {

	// Bug: I think this should be removed. It only serves
	// to handle a type error elsewhere.
	if ( draftString === "" )
	    return newDraft();

	var parsed = JSON.parse( draftString );

	var draftStruct = emptyDraft();

	if ( typeof( parsed.format ) !== "number" )
	    return error( "serial is not number" );

	if ( typeof( parsed.serial ) !== "number" )
	    return error( "serial is not number" );

	if ( typeof( parsed.title ) !== "string" )
	    return error( "serial is not string" );

	if ( Array.isArray( parsed.threads ) !== true )
	    return error( "threads is not Array" );

	if ( Array.isArray( parsed.colors ) !== true )
	    return error( "colors is not Array" );

	if ( typeof( parsed.code ) !== "string" )
	    return error( "code is not string" );

	draftStruct.serial  = parsed.serial;
	draftStruct.title   = parsed.title;
	draftStruct.threads = parsed.threads;
	draftStruct.colors  = parsed.colors;
	draftStruct.code    = parsed.code;

	return init( draftStruct );
    }    


    function init ( fDraftStruct: DraftStruct ) : Draft {
	
	fDraftStruct = ObjectHelpers.deepFreeze( fDraftStruct ); 

	var self: Draft = {
	    update   : update,
	    setTitle : setTitle,
	    toString : toString,
	    getData  : getData,
	}

	return self;

	function update( code: string, threads: Array<number>, colors: Array<number> ): Draft {
	    var draftStruct = emptyDraft();

	    draftStruct.serial  = fDraftStruct.serial + 1;
	    draftStruct.title   = fDraftStruct.title;
	    draftStruct.threads = threads;
	    draftStruct.colors  = colors;
	    draftStruct.code    = code;
	    
	    return init( draftStruct );
	}


	function setTitle( title: string ) : Draft {
	    var draftStruct = emptyDraft();

	    draftStruct.serial  = fDraftStruct.serial + 1;
	    draftStruct.title   = title;
	    draftStruct.threads = fDraftStruct.threads;
	    draftStruct.colors  = fDraftStruct.colors;
	    draftStruct.code    = fDraftStruct.code;
	    
	    return init( draftStruct );
	}

	
	function toString( ) : string {
	    return JSON.stringify( fDraftStruct );
	}

	function getData ( ) : DraftStruct {
	    return fDraftStruct;
	}
    }


    function error ( reason: string ) : any {
	return undefined;
    }


    function emptyDraft ( ) : DraftStruct {
	var draftStruct: DraftStruct = {
	    format  : 1,
	    serial  : 0,
	    title   : "Untitled draft",
	    threads : [],
	    colors  : [],
	    code    : '',
	};

	return draftStruct;
    }
}
