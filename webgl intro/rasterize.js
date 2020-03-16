/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
var Eye = new vec4.fromValues(0.5,0.5,-0.5,1.0); // default eye position in world space

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var colorPositionAttrib; //specifies color for fragment shader


// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input spheres

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read triangles in, load them into webgl buffers
function loadTriangles() {
    var inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
    
    if (inputTriangles != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords and its color attribute for WebGL
        var indexArray = [];// 1D array of traingle vertices
        var coord_index = new Map(); // hashmap to store the value vertexOffset for each vertex
        var idx = 0;

        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            // set up the vertex and index array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){

                //if a given traingle vertex is not present in the hashap, defines a new index offset for that vertex
            	if (coord_index.has(inputTriangles[whichSet].vertices[whichSetVert])){
            		coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
            	}
            	else{
	            	coord_index.set(inputTriangles[whichSet].vertices[whichSetVert], idx++);
	                coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                }
                // console.log(inputTriangles[whichSet].vertices[whichSetVert]);

	            //retrive color attributes for each triangle from input
	            var r = inputTriangles[whichSet].material.diffuse[0];
	            var g = inputTriangles[whichSet].material.diffuse[1];
	            var b = inputTriangles[whichSet].material.diffuse[2];

                //add color attributes to each triangle vertex
	            coordArray = coordArray.concat(r,g,b);
            	
            }
            // maintain an index array that stores unique indices for each vertex- handles common vertices
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++){
	        	for (var i = 0; i<3; i++){
                    //finds the vertex indexOffset for the associated traingle
	        		vertex_idx = inputTriangles[whichSet].vertices[inputTriangles[whichSet].triangles[whichSetTri][i]];

                    //adds the indexOffset to the index array
	        		indexArray = indexArray.concat(coord_index.get(vertex_idx));
	        	}
            }

        }// end for each triangle set 

        // console.log(coord_index);
        // console.log(indexArray);
        // console.log(coordArray.length);
        // console.log(coordArray);

        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        //send triangle indices to webGL
        triBufferSize = indexArray.length;
        triangleBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
        
    } // end if triangles found
} // end load triangles


// setup the webGL shaders
function setupShaders() {
    // define fragment shader in essl using es6 template strings
    // added code to return the given input color
    var fShaderCode = `
        precision mediump float;
        varying vec3 fragColor;
        void main(void) {
            gl_FragColor = vec4(fragColor, 1.0); // all fragments are white
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    //added code to accept input vertex and send it to fragment shader
    var vShaderCode = `
        precision mediump float;
        attribute vec3 vertexPosition;
        attribute vec3 vertexColor;
        
        varying vec3 fragColor;
        void main(void) {
            fragColor = vertexColor;
            gl_Position = vec4(vertexPosition, 1.0); // use the untransformed position
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program 
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); // get pointer to vertex shader input
                colorPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexColor");
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array for vertex
                gl.enableVertexAttribArray(colorPositionAttrib); //input to shader from array for color
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,6 * Float32Array.BYTES_PER_ELEMENT,0); // feed

    //defines the color offset to start after each vertex ends
    gl.vertexAttribPointer(colorPositionAttrib,3,gl.FLOAT,false,6 * Float32Array.BYTES_PER_ELEMENT,3 * Float32Array.BYTES_PER_ELEMENT); // feed

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);//index buffer activate
    gl.drawElements(gl.TRIANGLES,triBufferSize,gl.UNSIGNED_SHORT,0); // render
} // end render triangles


/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  
} // end main
