/// <reference path="typings/codemirror/codemirror.d.ts" />
module Editor {

    export interface Editor {
        setEditorMode( mode : string ) : void ;
	setContents( code: string ) : void ;
	getContents( ) : string;
    }

    export function factory ( root, code ): Editor {

        var self = {
            setEditorMode : setEditorMode,
	    setContents   : setContents,
	    getContents   : getContents,
        };
        
        var codeMirrorDiv = root.getElementById("code-mirror");

        var editor = CodeMirror( codeMirrorDiv, {
            value : code,
            mode:  "javascript",
            keyMap: "vim",
            lineNumbers: true,
        });

        return self;

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
