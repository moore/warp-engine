export module ObjectHelpers {

    export function update<T>( obj: T, replace: Object ): T {
	var next: any = {};
	var keys = Object.keys( obj );
	for ( let i = 0 ; i < keys.length ; i++  ) {
	    let key = keys[ i ];
	    if ( replace.hasOwnProperty( key ) )
		next[ key ] = replace[ key ];
	    else
		next[ key ] = obj[ key ];
	}

	return <T>next;
    }

    export function deepFreeze<T>( obj: T ): T {
	// From: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze

	// Retrieve the property names defined on obj
	var propNames = Object.getOwnPropertyNames(obj);

	// Freeze properties before freezing self
	propNames.forEach(function(name) {
	    var prop = obj[name];

	    // Freeze prop if it is an object
	    if (typeof prop == 'object' && prop !== null && !Object.isFrozen(prop))
		deepFreeze(prop);
	});

	// Freeze self
	return Object.freeze(obj);
    }
}
