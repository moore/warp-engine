/// <reference path="typings/codemirror/codemirror.d.ts" />

import {Controler} from "./Controler";

export module Editor {

    export interface Editor {
        setEditorMode( mode : string ) : void ;
	setContents( code: string ) : void ;
	getContents( ) : string;
	update( state: any ): void ;
    }

    export function factory<E> ( controler: Controler.Controler<E>, root: HTMLElement, code : string ): Editor {

        var self = {
            setEditorMode : setEditorMode,
	    setContents   : setContents,
	    getContents   : getContents,
	    update        : update,
        };
        
	controler.subscribe( self );

        var codeMirrorDiv = <HTMLElement>root.querySelector("#code-mirror");

        var editor = CodeMirror( codeMirrorDiv, {
            value : code,
            mode:  "javascript",
            keyMap: "vim",
            lineNumbers: true,
        });

	var fDraft = undefined;

        return self;

	function update ( state: any ): void  {
	    if ( state.draft !== fDraft ) {

		fDraft = state.draft;

		if ( fDraft !== undefined )
		    setContents( fDraft.getData().code );
	    }
	}


	function setContents ( code : string ) : void {
	    editor.getDoc().setValue( code );
	}

	function getContents ( ) : string {
	    return editor.getDoc().getValue( );
	}

        function setEditorMode ( mode ) {
            if (mode === "vim") {
                editor.setOption("keyMap", "vim");
            } else {
                editor.setOption("keyMap", "default");
            }
        }

    }
}
