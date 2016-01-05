 
import {Cap} from "./Cap";
import {Store} from "./Store";
import {ObjectHelpers} from "./ObjectHelpers";

export module User  {

    export interface User {
	addDocument( title: string, cap: Cap.Cap ): User;
	getHistory( ): any;
	save( store: Store.Store ): Promise<User>;
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
	name    : string;
	editor  : string;
	history : Array<Entry>;
    }


    export function factory ( fCap ) : Promise<User> {
	return load( fCap ).then( ( userRecord ) => {
	    var fUserRecord: UserRecord;

	    if ( userRecord === undefined )
		fUserRecord = newUser();

	    else
		fUserRecord = userRecord;
	    
	    return init( fCap, fUserRecord );
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

	function save ( store: Store.Store ): Promise<User> {
	    var data = JSON.stringify( fUserRecord );
	    localStorage.setItem( 'UserRecord', data );
	    return Promise.resolve( self );
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
	    name    : userRecord.name,
	    editor  : userRecord.editor,
	    history : newHistory,
	};

	return newRecord;
    }


    function load ( cap : Cap.Cap ) : Promise<UserRecord> {
	var jsonStr = localStorage.getItem( 'UserRecord' );

	if ( jsonStr === null )
	    return Promise.resolve( newUser() );

	return Promise.resolve( JSON.parse( jsonStr ) );
    }


    function newUser ( ) {
	var user: UserRecord = {
	    format  : 1,
	    name    : "Unknown User",
	    editor  : "default",
	    history : [],
	};

	return user;
    }

}
