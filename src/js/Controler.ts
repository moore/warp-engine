
export module Controler {

    export interface State<E> {
	accptor( app: Controler<E>, state: State<E>, event: E, data: any ): State<E>; 
    }

    export interface Subscriber<E> {
	update( state: State<E> ): void;
    }

    export interface Controler<E> {
	accept ( event: E, data: any ): void;
	subscribe ( subscriber: Subscriber<E> ): void; 
	reset ( ): State<E>;
    }

    export function factory<E> ( fState: State<E> ): Controler<E> {
        var self = { 
	    accept    : accept,
	    subscribe : subscribe,
	    reset     : reset,
	};

	let fStartState = fState;
	let fSubscribers: Array<Subscriber<E>> = [];

	return self;

	function accept ( event: E, data: any ): void {
	    console.log( "Event %s:", event, data ); //BOOG
	    let newState = fState.accptor( self, fState, event, data );
	    
	    console.log( "state %s > %s", (<any>fState).state, (<any>newState).state ); //BOOG

	    if ( newState === undefined )
		console.log( "Error accptor returned undefined!" ); // BUG: we should probbly enter error state!

	    else if ( newState !== fState )
		updateState( newState );
	}


	function subscribe ( subscriber: Subscriber<E> ): void {

	    for ( let i = 0 ; i < fSubscribers.length ; i++ ) {
		if ( fSubscribers[ i ] === subscriber )
		    return;
	    }

	    fSubscribers.push( subscriber );
	}


	function reset ( ): State<E> {
	    return updateState( fStartState );
	}


	function updateState ( state: State<E> ): State<E> {
	    let oldState: State<E> = fState;

	    fState = state;

	    for ( let i = 0 ; i < fSubscribers.length ; i++ )
		fSubscribers[ i ].update( state );

	    return oldState;
	}
    }

}
