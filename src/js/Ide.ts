/// <reference path="typings/codemirror/codemirror.d.ts" />
module Ide {

    export interface Ide {
        setEditorMode( mode : any ) : void ;

    }

    export function factory ( root, fCap, fStore, warpDisplay ): Ide {

        var ide = {
            setEditorMode : setEditorMode,

        };

        var drawButton = root.getElementById("draw");
        drawButton.onclick = drawWarp;

        var paletteModeSelector = root.getElementById("palette-mode");
        paletteModeSelector.onchange = paletteModeSelect;


        var showLogCheckbox = root.getElementById("show-log");
        showLogCheckbox.onchange = displayLog;

        
        var sandbox = root.querySelector( ".sandbox" );

        initSandbox( sandbox );
        
        var codeMirrorDiv = root.getElementById("code-mirror");
        var code = "";

        fStore.load( fCap ).then( loadResult );

        var captainsLogElm = root.getElementById("captains-log");

        var editor = CodeMirror( codeMirrorDiv, {
            value : code,
            mode:  "javascript",
            keyMap: "vim",
            lineNumbers: true,
        });

        setTimeout(resizeEditor, 0);
        window.onresize = resizeEditor;

        var warpStruct = {
            threads : [],
            colors  : [],
        };

        return ide;

        function initSandbox ( sandbox ) {

            window.addEventListener('message',
              function (event) {
                  // Sandboxed iframes which lack the 'allow-same-origin'
                  // header have "null" rather than a valid origin. This means you still
                  // have to be careful about accepting data via the messaging API you
                  // create. Check that source, and validate those inputs!
                  if (event.source === sandbox.contentWindow) {

                      var result = event.data;

                      if ( result.error !== undefined ) 
                          captainsLogElm.value = result.error;

                      else {
                          warpStruct.threads   = result.threads;
                          warpStruct.colors    = result.colors;
                          captainsLogElm.value = result.captainsLog;

                          var code = result.code;
                          
                          fStore.save( fCap, code );
                          warpDisplay.draw( warpStruct );
                      }
                  }
              });
        }
        
        function drawWarp ( ) {
            var code = editor.getDoc().getValue();

            captainsLogElm.value = "";
            var threads    = [];
            var colors     = [];

            sandbox.contentWindow.postMessage(code, "*");
        }
        
        function loadResult ( data ) {
            editor.getDoc().setValue( data.Data );
            drawWarp();
        }

        
        function paletteModeSelect () {
            warpDisplay.setPaletMode( paletteModeSelector.value );
        }

        function setEditorMode ( mode ) {
            if (mode === "vim") {
                editor.setOption("keyMap", "vim");
            } else {
                editor.setOption("keyMap", "default");
            }
        }

        function displayLog () {
            var showLog = showLogCheckbox.checked;
            if (showLog) {
                captainsLogElm.style.display = "block";    
            }
            else {
                captainsLogElm.style.display = "none";
            }
            resizeEditor();
        }


        function resizeEditor () {
            var editor = <HTMLElement>document.querySelector(".CodeMirror");
            var editorPosition = editor.getBoundingClientRect();
            var bodyMargin = +(getComputedStyle(document.body).marginBottom.slice(0, -2));
            editor.style.height = (window.innerHeight - editorPosition.top - bodyMargin) + "px";
        }

        function setLocation ( warpStruct ) {
            location.hash = fCap.toString();
        }
    }
}
