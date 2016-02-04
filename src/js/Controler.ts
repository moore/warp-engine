import {ObjectHelpers} from "./ObjectHelpers";

export module Controler {

    type Accptor<S,E,T> = ( state: S, struct: T, event: E, data: any ) => State<S,E,T>;
    type Subscriber<S,T> = ( state: S, struct: T ) => void;

    export interface State<S,E,T> {
	state  : S;
	struct : T;
	accptor: Accptor<S,E,T>;
    }

    export interface Controler<S,E,T> {
	accept( event: E, data: any ): void;
	subscribe( subscriber: Subscriber<S,T> ): void; 
	delegate<S2,E2,T2> ( updateEvent: E, state: State<S2,E2,T2>, eventMap?: {[key:number]:E2;} ): Controler<S2,E2,T2>;
	reset( ): State<S,E,T>;
	set( state: State<S,E,T> ): State<S,E,T>;
    }

    export function makeState<S,E,T> ( state: S, accptor: Accptor<S,E,T>, struct: T ): State<S,E,T> {
    return {
	state   : state,
	accptor : accptor,
	struct  : struct,
    };
}

    export function factory<S,E,T> ( fState: State<S,E,T> ): Controler<S,E,T> {
        var self = { 
	    accept    : accept,
	    subscribe : subscribe,
	    delegate  : delegate,
	    reset     : reset,	
            set       : set,
	};

	let fStartState = fState;
	let fSubscribers: Array<Subscriber<S,T>> = [];
	let fDelegates: { [key:string]:Controler<any,any,any> } = {};
        let fEventMap = {};
        let fPublishSchudled = false;

	return self;

	function delegate<S2,E2,T2> ( updateEvent: E, state: State<S2,E2,T2>, eventMap?: {[key:number]:E2;} ): Controler<S2,E2,T2> {
	
            let eventMapkeys = [];

            if ( eventMap !== undefined ) {
                eventMapkeys = Object.keys( eventMap );

                for ( let i = 0 ; i < eventMapkeys.length ; i++ ) {
                    if ( fEventMap[ eventMapkeys[ i ] ] !== undefined ) {
                        console.error( "can not map maped event!", eventMapkeys[ i ] );
                        return undefined; //BUG: better error;
                    }

                    if ( eventMapkeys[ i ] === updateEvent ) {
                        console.error( "can not map update event event!", eventMapkeys[ i ] );
                        return undefined; //BUG: better error;
                    }
                }
                    
            }

	    let subControler = factory( state );

            for ( let i = 0 ; i < eventMapkeys.length ; i++ ) {
                let event = eventMapkeys[ i ]; 
                fEventMap[ event ] = [ subControler, eventMap[ event ], updateEvent ];
            }


	    // BUG: Using a subscription dose not feel like the 
            // right way to do this; but it easy and I can fix it later.
	    subControler.subscribe(  
		( stateType: S2, struct: T2 ) => accept( updateEvent, struct ) );
	    
            accept( updateEvent, state.struct );

	    return subControler;
	}


        // BUG: this is just done this way to *hide* types.
        // I could not firue out the right way to do it. 
        function getMaped ( key ) {
            return fEventMap[ key ];
        }


	function accept ( event: E, data: any ): void {

	    console.log( "receved event: ", event, data ); //BOOG

            let newState: State<S,E,T>;
            let mapped = getMaped( event );

            if ( mapped === undefined ) 
	        newState = fState.accptor(
                    fState.state, fState.struct, event, data );

            else {
                console.log( "delegating..." ); //BOOG

                if ( mapped[2] === event ) {
                    console.error( "event and result are equal!", event );
                    return;
                }

                let subStruct = mapped[0].accept( mapped[1], data );
                newState = fState.accptor( 
                    fState.state, fState.struct, mapped[2], subStruct );
            }

            
	    	    
	    if ( newState === undefined )
		console.log( "Accptor returned undefined!" );
            else
            	console.log( " %s -> %s ", fState.state, newState.state ); //BOOG


	    if ( newState !== undefined && newState !== fState )
		updateState( newState );

            else
                console.log( "No updateState:", newState, fState );

	}


	function subscribe ( subscriber: Subscriber<S,T> ): void {

	    for ( let i = 0 ; i < fSubscribers.length ; i++ ) {
		if ( fSubscribers[ i ] === subscriber )
		    return;
	    }

	    fSubscribers.push( subscriber );
	}


	function reset ( ): State<S,E,T> {
		return updateState( fStartState );
	}


	function set ( state: State<S,E,T> ): State<S,E,T> {
	    return updateState( state );
	}


	function updateState ( state: State<S,E,T> ): State<S,E,T> {
	    let oldState = fState;

	    fState = ObjectHelpers.deepFreeze( state );

            // Defer work to preserve logical sequanceing.
            Promise.resolve([state, fSubscribers.slice(0)]).then(callSubscribers); 

	    return oldState;
	}
        

        function callSubscribers ( args ): void {
            let state: State<S,E,T> = args[0];
            let subscribers: Array<Subscriber<S,T>> = args[1];

	    for ( let i = 0 ; i < subscribers.length ; i++ )
         	subscribers[ i ]( state.state, state.struct );
        }

    }

}
