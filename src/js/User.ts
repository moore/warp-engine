/// <reference path="./Cap.ts" />
module User  {

    export interface User {
	addDocument( title : string, cap : Cap.Cap ) : void ;
	getHistory( ) : any ;
    }

    interface Entry {
	title : string;
	name  : string;
	read  : string;
	write : string;
    }

    interface UserRecord {
	name    : string;
	editor  : string;
	history : Array<Entry>;
    }

    export function factory ( ) : User {

	var self = {
	    addDocument : addDocument,
	    getHistory  : getHistory,
	};

	var fUserRecord: UserRecord = load();

	if ( fUserRecord === undefined )
	    fUserRecord = newUser();

	return self;


	function addDocument ( title: string, cap: Cap.Cap ) : void {

	    if ( cap.getMode() === 'read' ) {
		addDocumentWorker( title, cap.toString(), "" );
	    }

	    else {
		cap.toRead().then( function ( readCap ) {
		    addDocumentWorker( title, readCap.toString(), cap.toString() );
		} );
	    }
	    
	}

	function addDocumentWorker ( title: string, read: string, write: string ) : void {

	    var history  = fUserRecord.history;

	    if ( history.length > 0 ) {
		let head = history[0];

		if ( head.title === title
		     && head.read === read
		     && head.write === write )
		    return;
	    }

	    var entry: Entry =  {
		title : title,
		name  : "",
		read  : read,
		write : write,
	    };

	    var newHistory: Array<Entry> = [ entry ];

	    for ( var i = 0 ; i < history.length ; i++ ) {
		var current = history[ i ];

		if ( current.read !== entry.read )
		    newHistory.push( current );

		else if ( current.write !== "" ) {
		    current.title = title;
		    newHistory[0] = current ;
		}
	    }

	    fUserRecord.history = newHistory;

	    save( );
	}

	function getHistory ( ) {
	    // BUG: Lame hack
	    return JSON.parse( JSON.stringify( fUserRecord.history ) );
	}

	function save ( ) {
	    var data = JSON.stringify( fUserRecord );
	    localStorage.setItem( 'UserRecord', data );
	}

	function load ( ) {
	    var jsonStr = localStorage.getItem( 'UserRecord' );

	    if ( jsonStr === null )
		return undefined;

	    return JSON.parse( jsonStr );
	}


	function newUser ( ) {
	    var user: UserRecord = {
		name    : "Unknown User",
		editor  : "default",
		history : [],
	    };

	    return user;
	}
    }

}
