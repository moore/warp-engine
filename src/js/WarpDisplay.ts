
import {AppControler, EndInfo} from "./AppState";

export module WarpDisplay  {

    export interface Display {
	draw( warp: any ): void ;
	update( state: any ): void ;
	setPaletMode( mode: any ): void ;
    }


    export function factory ( controler: AppControler, root: HTMLElement ) : Display {
	
	var container = <HTMLElement>root.querySelector("#code-output");
	var canvas    = <HTMLCanvasElement>root.querySelector("#canvas");
	var ctx       = canvas.getContext("2d");
	var palette   = <HTMLElement>root.querySelector("#color-palette");
	var warpEnds  = <HTMLElement>document.querySelector("#warp-ends");

	var fDraft = undefined;

	var warpDisplay = {
	    update       : update,
	    draw         : draw,
	    setPaletMode : setPaletMode,
	}

	return warpDisplay;

	function update ( state: any ): void {
	    if ( state.draft !== fDraft ) {
		fDraft = state.draft;
		draw( fDraft.getData() );
	    }
	}

	function draw ( warp ) {
	    var threads = warp.threads;
	    var colors  = warp.colors;

	    var threadWidth;
	    var warpWidth;

	    if (threads.length === 0) {
		warpWidth = 400;
	    } else if (threads.length < 400) {
		threadWidth = Math.ceil(400 / threads.length);
		warpWidth = threadWidth * threads.length;
	    } else {
		threadWidth = 1;
		warpWidth = threads.length;
	    }

	    canvas.width = warpWidth;
	    
	    ctx.clearRect(0, 0, canvas.width, canvas.height);

	    for ( var i = 0 ; i < threads.length ; i++ ) {
		var offset = i * threadWidth;

		ctx.fillStyle = colors[ threads[ i ] ];
		ctx.fillRect( offset, 0, threadWidth, canvas.height );
	    }                 
	    
	    container.style.width = ((warpWidth + 2) + "px");
	    updateWarpCount( threads );
	    buildPalette(warp.colors, warp.threads);
	}

	function updateWarpCount ( threads ) {
	    warpEnds.innerHTML = "";

	    var warpEndCount = document.createTextNode("total warp ends: " + threads.length);
	    warpEnds.appendChild(warpEndCount);     
	}

	function buildPalette ( colors, threads ) {
	    
	    var colorCounts = [];

	    for (var i = 0; i < colors.length; i ++)
		colorCounts[i] = 0;

	    for (var i = 0; i < threads.length; i ++)
		colorCounts[threads[i]]++;

	    palette.innerHTML = "";

	    for (var i = 0; i < colors.length; i ++) {
		
		var colorDiv = document.createElement("div");
		var colorIndex = document.createTextNode(String(i));
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

	function setPaletMode ( mode ) {
	    if ( mode === EndInfo.Indexes) {
		palette.classList.add("show-index");
		palette.classList.remove("show-count");
	    } else {
		palette.classList.add("show-count");
		palette.classList.remove("show-index");
	    }
	}

    }

}
