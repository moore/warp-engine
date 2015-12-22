module ObjectHelpers {

    export function deepFreeze<T>( obj : T ) : T {
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
