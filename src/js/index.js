var canvas =  document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var palette = document.getElementById("color-palette");

var threadWidth = 1;
var threads = [];
var colors  = [];

var drawButton = document.getElementById("draw");
drawButton.onclick = draw;

var paletteModeSelector = document.getElementById("palette-mode");
paletteModeSelector.onchange = paletteModeSelect;

var editorSelector = document.getElementById("editor-mode");
editorSelector.onchange = editorSelect;

var codemirrorDiv = document.getElementById("codemirror");
var code = localStorage.getItem( 'code' );

if ( code === null )
    code = 'colors  = [ "LightCoral", "Plum", "SeaGreen" ];\nthreads = [ ];\n\nfor (var i = 0; i < 100; i++ )\n  for ( var j = 0 ; j < 3 ; j++ )\n    threads.push(j);';

var editor = CodeMirror( codemirrorDiv, {
    value : code,
    mode:  "javascript",
	keyMap: "vim",
	lineNumbers: true,
});

draw();

function draw () {
    var code = editor.getValue();

    eval( code );
    localStorage.setItem( 'code', code );
	canvas.width = threads.length;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for ( var i = 0 ; i < threads.length ; i++ ) {
	var offset = i * threadWidth;

	ctx.fillStyle = colors[ threads[ i ] ];
	ctx.fillRect( offset, 0, threadWidth, canvas.height );
    }		      
	buildPalette();
}

function buildPalette () {
	
	var colorCounts = [];
	for (var i = 0; i < colors.length; i ++)
		colorCounts[i] = 0;
	for (var i = 0; i < threads.length; i ++)
		colorCounts[threads[i]]++;

	palette.innerHTML = "";

	for (var i = 0; i < colors.length; i ++) {
		
		var colorDiv = document.createElement("div");
		var colorIndex = document.createTextNode(i);
		var indexSpan = document.createElement("span");
		var colorCount = document.createTextNode(colorCounts[i]);
		var countSpan = document.createElement("span");
		var colorSwatch = document.createElement("div");

		colorDiv.classList.add("color-div");
		colorSwatch.classList.add("color-swatch");
		indexSpan.classList.add("color-index");
		countSpan.classList.add("color-count");

		colorSwatch.style.backgroundColor = colors[i];
		
		indexSpan.appendChild(colorIndex);
		countSpan.appendChild(colorCount);
		colorDiv.appendChild(indexSpan);
		colorDiv.appendChild(countSpan);
		colorDiv.appendChild(colorSwatch);
		palette.appendChild(colorDiv);
	}
}

function paletteModeSelect () {
	if (paletteModeSelector.value === "palette-by-index") {
		palette.classList.add("show-index");
		palette.classList.remove("show-count");
	} else {
		palette.classList.add("show-count");
		palette.classList.remove("show-index");
	}
}

function editorSelect () {
	var mode = editorSelector.value;
	if (mode === "vim") {
		editor.setOption("keyMap", "vim");
		console.log(editor.options.keyMap);
	} else {
		editor.setOption("keyMap", "default");
		console.log(editor.options.keyMap);
	}
}

function shuffle (array) {
    var halfLength = Math.ceil(array.length/2);
    var firstHalf = array.slice(0, halfLength);
    var lastHalf = array.slice(halfLength, array.length);
    var shuffledArray = [];

    while (firstHalf.length != 0 && lastHalf.length != 0) {
	var n = Math.random();
	if (n < 0.5) {
	    shuffledArray.push(firstHalf.shift())
	} else {
	    shuffledArray.push(lastHalf.shift())
	}   
    }

    return shuffledArray.concat(firstHalf.concat(lastHalf));
}
