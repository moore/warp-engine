 
import {Cap} from "./Cap";
import {Store} from "./Store";
import {ObjectHelpers} from "./ObjectHelpers";

export module User  {

    export interface User {
	addDocument( title: string, cap: Cap.Cap ): User;
	getHistory( ): any;
	save( store: Store.Store ): Promise<any>; //BUG: add better type
    }

    interface Entry {
	format : number;
	title  : string;
	name   : string;
	read   : string;
	write  : string;
    }

    interface UserRecord {
	format  : number;
	serial  : number;
	name    : string;
	editor  : string;
	history : Array<Entry>;
    }


    export function factory ( fCap, store ) : Promise<User> {

	return store.load( fCap )
	    .then( ( result ) => {
		if ( result.code !== 'ok' )
		    return Promise.reject( result );

		let userRecord = JSON.parse( result.data.Data );
		let user       = init( fCap, userRecord );

		return Promise.resolve( user );

	    } )
	    .catch( ( result ) => {
		if ( result.code !== 'no-record' )		
		    return Promise.reject( result.reason );

		let user = init( fCap, newUser() );
		return Promise.resolve( user );
	    } );
    }


    function init ( fCap: Cap.Cap, fUserRecord: UserRecord ) : User {
	var self = {
	    addDocument : addDocument,
	    getHistory  : getHistory,
	    save        : save,
	};

	fUserRecord = ObjectHelpers.deepFreeze( fUserRecord );

	return self ;

	function addDocument ( title: string, cap: Cap.Cap ): User {
	    let readCap = cap.toRead();

	    let read : string;
	    let write: string;

	    // toRead returns self is cap is read cap
	    if ( readCap === cap ) {
		read  = readCap.toString();
		write = ""
	    }

	    else {
		read  = readCap.toString();
		write = cap.toString();
	    }

	    let newUserRecord = addDocumentWorker( fUserRecord, title, read, write );

	    return init( fCap, newUserRecord );
	}

	function getHistory ( ) {
	    return fUserRecord.history;
	}

	function save ( store: Store.Store ): Promise<any> {

	    let userString = JSON.stringify( fUserRecord );
	    let serial      = fUserRecord.serial;
	    let dataType    = 'UserRecord';
		
            return store.save( fCap, serial, dataType, userString );
	}
    }


    function addDocumentWorker ( userRecord : UserRecord, 
				 title: string, 
				 read: string, 
				 write: string ) : UserRecord {

	var history  = userRecord.history;

	if ( history.length > 0 ) {
	    let head = history[0];

	    if ( head.title === title
		 && head.read === read
		 && head.write === write )
		return userRecord;
	}

	var entry: Entry =  {
	    format : 1,
	    title  : title,
	    name   : "",
	    read   : read,
	    write  : write,
	};

	var newHistory: Array<Entry> = [ entry ];

	for ( var i = 0 ; i < history.length ; i++ ) {
	    var current = history[ i ];

	    if ( current.read !== entry.read ) {
		newHistory.push( current );
		continue;
	    }

	    // Update write cap if entry dose not have one
	    if ( entry.write === "" ) {
		entry.write = current.write;
	    }

	    entry.name = current.name;
	}

	let newRecord: UserRecord  = {
	    format  : 1,
	    serial  : userRecord.serial + 1,
	    name    : userRecord.name,
	    editor  : userRecord.editor,
	    history : newHistory,
	};

	return newRecord;
    }


    function newUser ( ) {
	var user: UserRecord = {
	    format  : 1,
	    serial  : 1,
	    name    : "Unknown User",
	    editor  : "default",
	    history : [],
	};

	return user;
    }

}
