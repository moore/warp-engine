/// <reference path="typings/whatwg-fetch/whatwg-fetch.d.ts" />

import {Cap} from "./Cap";

export module Store  {

    export interface Store {
        save( cap: Cap.Cap, serial: number, dataType: string, code: string ): any ;
        load( cap: Cap.Cap ): any ;
    }


    export function factory ( ) : Store {


        var store = {
            save : save,
            load : load,
        };

        return store;


        function save ( cap, serial, dataType, code ) {

            if ( cap.getMode() !== 'edit' )
                return;

            var readCap = cap.toRead();

            var preimage  = cap.getKey();
            var key       = readCap.getKey();

            var url = "/set";

            var request = {
                Preimage : preimage,
		Serial   : serial,
                Key      : key,
                DataType : dataType,
                Data     : code,
            }

            return fetch(url, {  
                method: 'post',  
                headers: {  
                    "Content-type": "application/json; charset=UTF-8"  
                },  
                body: JSON.stringify(request)
            })
                .then(json)  

            function json (response) {
		return response.json().then( 
		    function ( data ) { 
			if ( data.code === 'ok' )
			    return Promise.resolve( { ok: response.ok, data : data } );
			else
			    return Promise.reject( data );
		    } );
            } 
        }

        function load ( cap ) {

            var url = "/get";

            var request = {
                Key : cap.toRead().getKey(),
            }

            return fetch(url, {  
                method: 'post',  
                headers: {  
                    "Content-type": "application/json; charset=UTF-8"  
                },  
                body: JSON.stringify(request) })
                .then(json);  

            function json(response) {
		return response.json().then( 
		    function ( data ) { 
			if ( data.code === 'ok' )
			    return Promise.resolve( data );
			else
			    return Promise.reject( data );
		    } );
            }
        }

    }

}
