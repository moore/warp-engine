var canvas =  document.getElementById("canvas");
var ctx = canvas.getContext("2d");

var bodyStyle = getComputedStyle(document.body);

canvas.width  = +bodyStyle.width.slice(0, -2);
canvas.height = +bodyStyle.height.slice(0, -2);

var width  = canvas.width;
var height = canvas.height;

var threads = [];
var colors  = [ "orange", "blue" ];

for ( var i = 1 ; i <= 125 ; i++ )
    threads.push( i % 2 );

var drawButton = document.getElementById("draw");

drawButton.onclick = draw;

var codemirrorDiv = document.getElementById("codemirror");

var editor = CodeMirror( codemirrorDiv, {
  mode:  "javascript"
});

draw();

function draw () {

    eval(editor.getValue());
    
    var threadWidth = width / threads.length;
    for ( var i = 0 ; i < threads.length ; i++ ) {
	var offset = i * threadWidth;

	ctx.fillStyle = colors[ threads[ i ] ];
	ctx.fillRect( offset, 0, threadWidth, height );
    }		      
}