import {ObjectHelpers} from "./ObjectHelpers";
import {Cap} from "./Cap";
import {Store} from "./Store";
import {Controler} from "./Controler";


export enum DraftState {
    Start,
    Loading,
    Ready,
    NotFound,
    LoadError,
    SaveError,
    SerialError,
}

export enum DraftEvent {
    LoadCap,
    SetCap,
    SetDocument,
    NewDocument,
    CopyDocument,
    Received,
    NotFound,
    Update,
    SetTitle,
    Saved,
    SaveError,
    LoadError,
    SerialError,
}

export interface DraftDoc {
    format  : number;
    serial  : number;
    title   : string;
    threads : Array<number>;
    colors  : Array<number>;
    code    : string;
    log     : string;
}

export interface DraftStruct {
    cap     : Cap.Cap;
    saved   : boolean;
    doc     : DraftDoc;
}



export module Draft  {

    export type Draft = Controler.State<DraftState,DraftEvent,DraftStruct>;

    export type DraftControler = Controler.Controler<DraftState,DraftEvent,DraftStruct>;

    export function StartState( ): Controler.State<DraftState,DraftEvent,DraftStruct> {
        let struct = {
            cap     : undefined,
            saved   : true,
            doc     : undefined,
        }
;
        return Controler.makeState( DraftState.Start, startAccptor, struct )
    }


    function startAccptor ( state: DraftState, struct: DraftStruct, event: DraftEvent, data: any ): Draft {
        let result: Draft;

        if ( event === DraftEvent.LoadCap )
            result = Controler.makeState(
                DraftState.Loading, loadingAccptor, { 
                    cap     : <Cap.Cap>data,
                    saved   : true,
                    doc     : undefined,
                } );

        else if ( event === DraftEvent.SetDocument )
            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap     : data.cap,
                    saved   : true,
                    doc     : data.doc,
                } );

        else if ( event === DraftEvent.NewDocument )
            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap     : <Cap.Cap>data,
                    saved   : false,
                    doc     : emptyDraft(),
                } );

        else
            console.log( "undexpected event: ", event, data );


        return result;
    }



    function loadingAccptor ( state: DraftState, struct: DraftStruct, event: DraftEvent, data: any ): Draft {
        let result: Draft;

        if ( event === DraftEvent.Received )
            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap    : struct.cap,
                    saved  : true,
                    doc    : data,
                } );

        else if ( event === DraftEvent.NotFound )
            result = Controler.makeState(
                DraftState.NotFound, stopAccptor, struct );

        else if ( event === DraftEvent.LoadError )
            result = Controler.makeState( 
                DraftState.LoadError, stopAccptor, struct );

        else
            console.log( "undexpected event: ", event, data );
        

        return result;
    }




                                    
    function readyAccptor ( state: DraftState, struct: DraftStruct, event: DraftEvent, data: any ): Draft {
        let result: Draft;

        if ( event === DraftEvent.Saved )
            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap    : struct.cap,
                    saved  : true,
                    doc    : struct.doc,
                } );

        else if ( event === DraftEvent.SaveError )
            result = Controler.makeState(
                DraftState.SaveError, stopAccptor, {
                    cap    : data,
                    saved  : false,
                    doc    : struct.doc,
                } );

        else if ( event === DraftEvent.SerialError ) {
            result = Controler.makeState(
                DraftState.SerialError, stopAccptor, {
                    cap    : struct.cap,
                    saved  : false,
                    doc    : struct.doc,
                } );
        }
        
        else if ( event === DraftEvent.SetCap )
            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap    : data,
                    saved  : false,
                    doc    : struct.doc,
                } );

        else if ( event === DraftEvent.Update ) {
            let doc = ObjectHelpers.update( struct.doc, data );
            doc.serial++;

            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap    : struct.cap,
                    saved  : false,
                    doc    : doc,
                } );
        }

        else if ( event === DraftEvent.SetTitle ) {
            let doc = ObjectHelpers.update( struct.doc, { title: data } );
            doc.serial++;

            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap    : struct.cap,
                    saved  : false,
                    doc    : doc,
                } );
        }

        else if ( event === DraftEvent.NewDocument )
            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap     : <Cap.Cap>data,
                    saved   : false,
                    doc     : emptyDraft(),
                } );

        else if ( event === DraftEvent.CopyDocument ) {
            let newTitle = struct.doc.title + " (copy)";
            let doc = ObjectHelpers.update( struct.doc, { serial: 1, title: newTitle } );

            result = Controler.makeState(
                DraftState.Ready, readyAccptor, { 
                    cap     : <Cap.Cap>data,
                    saved   : false,
                    doc     : doc,
                } );
        }

        else if ( event === DraftEvent.LoadCap )
            result = Controler.makeState(
                DraftState.Loading, loadingAccptor, { 
                    cap     : <Cap.Cap>data,
                    saved   : true,
                    doc     : undefined,
                } );
        else
            console.log( "undexpected event: ", event, data );
        

        return result;
    }

   

    function stopAccptor ( state: DraftState, struct: DraftStruct, event: DraftEvent, data: any ): Draft {
        return undefined;
    }


    export function DraftActor ( fControler: DraftControler, fStore: Store.Store ): {} {
        
        fControler.subscribe( update );
        let fStruct: DraftStruct;

        return {};
        

        function update ( state: DraftState, struct: DraftStruct ) {
            if ( state === DraftState.Loading )
                loadingActor( fStruct, struct, fStore, fControler );

            else if ( state === DraftState.Ready )
                readyActor( fStruct, struct, fStore, fControler );

            // else nothing

            fStruct = struct;
        }
    }

 
    function loadingActor ( oldStruct: DraftStruct, newStruct: DraftStruct, store: Store.Store, controler: DraftControler ) {
        store.load( newStruct.cap )
 	    .then( ( response ) => {

		if ( response.code === 'ok' )
		    controler.accept( DraftEvent.Received, fromString( response.data.Data ) );

		else if ( response.code === 'no-record' )
		    controler.accept( DraftEvent.NotFound, response.data );

                else
		    controler.accept( DraftEvent.LoadError, response.data );

	    })
	    .catch( ( error ) => {
		controler.accept( DraftEvent.LoadError, error );
	    } );

    }


    function readyActor ( oldStruct: DraftStruct, newStruct: DraftStruct,
                          store: Store.Store, controler: DraftControler ) {

        if ( oldStruct === undefined || ( oldStruct.doc !== undefined &&
                                          oldStruct.doc !== newStruct.doc) ) {
            let cap         = newStruct.cap;
            let serial      = newStruct.doc.serial;
            let dataType    = 'DraftStruct';
            let draftString = toString( newStruct.doc );

            store.save( cap, serial, dataType, draftString )
                .then( ( result ) => {
	            if ( result.ok === true )
		        controler.accept( DraftEvent.Saved, result.data.serial );
                    else
                        console.error( "this should never happen!" );
                })
                .catch( error => {
                    if ( error.code === 'serial' )
                        controler.accept( DraftEvent.SerialError, true );
                    else
                        controler.accept( DraftEvent.SaveError, true );
                })
            ;
        }

    }


    function fromString ( draftString : string ) : DraftDoc {

        var parsed = JSON.parse( draftString );

        if ( parsed.format !== 1 )
            return error( "format is not 1" );

        if ( typeof( parsed.serial ) !== "number" )
            return error( "serial is not number" );

        if ( typeof( parsed.title ) !== "string" )
            return error( "title is not string" );

        if ( Array.isArray( parsed.threads ) !== true )
            return error( "threads is not Array" );

        if ( Array.isArray( parsed.colors ) !== true )
            return error( "colors is not Array" );

        if ( typeof( parsed.code ) !== "string" )
            return error( "code is not string" );

        if ( typeof( parsed.log ) !== "string" )
            return error( "log is not string" );

        return {
            format  : 1,
            serial  : parsed.serial,
            title   : parsed.title,
            threads : parsed.threads,
            colors  : parsed.colors,
            code    : parsed.code,
            log     : parsed.log,
        };
    }    



    function load ( cap: Cap.Cap, store: Store.Store ): Promise<Draft> {
        return <Promise<Draft>>store.load( cap )
            .then( result => fromString( result ) )
        ;
    }
    
    function save ( struct: DraftStruct, store: Store.Store ): Promise<any> {
        let cap         = struct.cap;
        let serial      = struct.doc.serial;
        let dataType    = 'DraftStruct';
        let draftString = toString( struct.doc );

        return store.save( cap, serial, dataType, draftString );
    }

    
    function toString( struct: DraftDoc ) : string {
        return JSON.stringify( struct );
    }


    function error ( reason: string ) : any {
        return undefined;
    }


    function emptyDraft ( ) : DraftDoc {
        return {
            format  : 1,
            serial  : 1,
            title   : "Untitled draft",
            threads : [],
            colors  : [],
            code    : '',
            log     : '',
        };
    }
}
