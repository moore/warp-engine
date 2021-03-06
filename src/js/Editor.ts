/// <reference path="typings/codemirror/codemirror.d.ts" />
import {Sandbox} from "./Sandbox";
import { EventType, EndInfo, AppControler} from "./AppState";


import {Controler} from "./Controler";

export module Editor {

    export interface Editor {
        setEditorMode( mode : string ) : void ;
	setCaptiansLog ( value: string ): void;
	setReadOnly ( readOnly: boolean ): void;
	setContents( code: string ) : void ;
	getContents( ) : string;
	update( state: any ): void ;
    }

    export function factory ( controler: AppControler, root: HTMLElement, code : string ): Editor {

        var self = {
            setEditorMode  : setEditorMode,
	    setCaptiansLog : setCaptiansLog,
	    setReadOnly    : setReadOnly,
	    setContents    : setContents,
	    getContents    : getContents,
	    update         : update,
        };
        
	controler.subscribe( update );

        var codeMirrorDiv = <HTMLElement>root.querySelector("#code-mirror");

        var editor = CodeMirror( codeMirrorDiv, {
            value : code,
            mode:  "javascript",
            lineNumbers: true,
        });

	var fDraft = undefined;
	let fSandbox = Sandbox.factory( root );

        var fCaptainsLogElm = <HTMLInputElement>root.querySelector("#captains-log");

        var paletteModeSelector = <HTMLInputElement>root.querySelector("#palette-mode");
        paletteModeSelector.onchange = paletteModeSelect;


        var showLogCheckbox = <HTMLInputElement>root.querySelector("#show-log");
        showLogCheckbox.onchange = displayLog;

        var drawButton = <HTMLElement>root.querySelector("#draw");
        drawButton.onclick = runCode;

        setTimeout(resizeEditor, 0);
        window.onresize = resizeEditor;

        return self;

	function update ( state: any ): void  {
	    if ( state.draft !== fDraft ) {

		fDraft = state.draft;

		if ( fDraft !== undefined )
		    setContents( fDraft.getData().code );
	    }
	}


	function setContents ( code : string ) : void {
            if ( getContents() !== code )
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


	function setReadOnly ( readOnly: boolean ): void {
	    editor.setOption( 'readOnly', readOnly );
	}


	function setCaptiansLog ( value: string ): void {
		fCaptainsLogElm.value = value;
	}

        function runCode ( ) {
            var code = getContents();

            fSandbox.evaulate( code )
                .then( function ( result: Sandbox.SandboxResult ) {
		    controler.accept( EventType.UpdateDraft, result );
                } )
                .catch( function ( error: Sandbox.SandboxError ) {
                    if ( error.cancled === true )
                        console.log( "evaluation cancled becouse: '%s'", error.reason );
                    else
			controler.accept( EventType.RuntimeError, error );
                } );
        }

        function paletteModeSelect () {
	    let mode: EndInfo;
	    let modeString: string = paletteModeSelector.value;

	    if ( modeString === 'palette-by-index' )
		mode = EndInfo.Indexes;
	    else
		mode = EndInfo.Counts

	    controler.accept( EventType.PalettModeSelect, mode );
        }

        function displayLog () {
            var showLog = showLogCheckbox.checked;

            if (showLog) {
                fCaptainsLogElm.style.display = "block";    
            }
            else {
                fCaptainsLogElm.style.display = "none";
            }

            resizeEditor();
        }

        function resizeEditor () {
            var editor = <HTMLElement>document.querySelector(".CodeMirror");
            var editorPosition = editor.getBoundingClientRect();
            var bodyMargin = +(getComputedStyle(document.body).marginBottom.slice(0, -2));
            editor.style.height = (window.innerHeight - editorPosition.top - bodyMargin) + "px";
        }
    }
}
