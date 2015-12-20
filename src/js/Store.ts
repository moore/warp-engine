/// <reference path="typings/whatwg-fetch/whatwg-fetch.d.ts" />
/// <reference path="./Cap.ts" />

module Store  {

    export interface Store {
        save( cap : Cap.Cap, code : string ) : any ;
        load( cap : Cap.Cap ) : any ;
    }


    export function factory ( ) : Store {


        var store = {
            save : save,
            load : load,
        };

        return store;


        function save ( cap, code ) {

            if ( cap.getMode() !== 'edit' )
                return;

            cap.toRead()
                .then( function ( readCap ) {
                    var preimage  = cap.getKey();
                    var key       = readCap.getKey();

                    var url = "/set";

                    var request = {
                        Preimage : preimage,
                        Key      : key,
                        DataType : "JavaScript",
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
                        .then(function (data) {  
                            return Promise.resolve( data );
                        })  
                        .catch(function (error) {  
                            console.log('Request failed', error);
                            return Promise.reject( undefined );
                        });

                    function json(response) {  
                        return response.json()  
                    } 
                });
        }

        function load ( cap ) {

            var url = "/get";

            var result;

            if ( cap.getMode() === 'edit' )
                result = cap.toRead()
                .then( doLoad );

            else {
                result = doLoad( cap );
            }

            return result;

            function doLoad ( readCap ) {
                var request = {
                    Key : readCap.getKey(),
                }

                return fetch(url, {  
                    method: 'post',  
                    headers: {  
                        "Content-type": "application/json; charset=UTF-8"  
                    },  
                    body: JSON.stringify(request) })
                    .then(json);  

                function json(response) {  
                    return response.json()  
                }
            }

        }

    }

}
