/* GLOBAL CONSTANTS AND VARIABLES */
// https://ncsucgclass.github.io/prog3/triangles2.json
// https://ncsucgclass.github.io/prog2/triangles.json
/* assignment specific globals */

const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
var Eye = new vec3.fromValues(0.5,0.5,-0.5); // default eye position in world space
var Light = new vec3.fromValues(-0.5,1.5,-0.5);// default light position in world space
var lookUpV = new vec3.fromValues(0.0,0.1,0.0);// default up position in world space
var lookAtV = new vec3.fromValues(0.0,0.0,1.0);// default at position in world space
var Center = new vec3.fromValues(0.5,0.5,0.0);// default window center in world space
var Near = 0.1;// near value for projection matrix
var Far = 100;// far value for projection matrix
var is_ortho = false; //sets itself to true onyl when parallel projection
var curr_model = 0.0; //sets number for current model
var is_highlight = false;
var transformM = mat4.create();
var cent = vec3.create();


/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var ambientBuffer; // this contains vertex coordinates in triples
var diffuseBuffer; // this contains vertex coordinates in triples
var specularBuffer; // this contains vertex coordinates in triples
var nBuffer; // this contains vertex coordinates in triples
var normalBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var triBufferSize; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var vertexDiffAttrib; // where we put diffuse val for each vertex
var vertexAmbAttrib; // where we put ambient val for each vertex
var vertexSpecAttrib; // where we put specular val for each vertex
var vertexNAttrib; // where we put n val for each vertex
var vertexNormalAttrib; // where to put normal for vertex shader
var altPositionUniform; // where to put altPosition flag for vertex shader
var eyeUniform; // where to put eye vector values
var lightUniform; // where to put light vector values
var inputTriangles;
var canvas;
var transformUniform, transformM; //sets up world matrix and shader variable
var viewUniform, viewM; //sets up view matrix and shader variable
var projUniform, projM; //sets up proj matrix and shader variable
var tri_state; // saves the centers for each triangle set
var transformBuffer;
var transformArray; // saves all values of 
var transformSetAttribute;
var transformSetUniform;
var vertexSetAttrib;// saves the traingle set number for each vertex
var currModelUniform;
var setBuffer;// webgl buffer to save the traingle set number for each vertex

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
    canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
        //handle clicks
        document.onkeydown = handleDownKey;
        document.onkeyup = handleUpKey;
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

//handle key presses: ref[4]
var allPressedKeys = {};
function handleDownKey(event){

	allPressedKeys[event.keyCode] = true;
    traslateBy = 0.025;
    cent = tri_state[curr_model];
    transformM = transformArray[curr_model];

	if(allPressedKeys[65] && !allPressedKeys[16]){ 		// a => move view left along X
        Eye[0]+= traslateBy;
	}

    if(allPressedKeys[68] && !allPressedKeys[16]){      // d => move view right along X
        Eye[0] -= traslateBy;
    }

    if(allPressedKeys[81] && !allPressedKeys[16]){      // q => move up along Y
        Eye[1]+= traslateBy;
    }

    if(allPressedKeys[69] && !allPressedKeys[16]){      // e => move down along Y
        Eye[1] -= traslateBy;
    }

    if(allPressedKeys[87] && !allPressedKeys[16]){      // w => move forward along Z
        Eye[2]+= traslateBy;
    }

    if(allPressedKeys[83] && !allPressedKeys[16]){      // s => move backward along Z
        Eye[2] -= traslateBy;
    }

    if(allPressedKeys[65] && allPressedKeys[16]){      // A => rotate left along Y (yaw)
        vec3.rotateY(lookAtV, lookAtV, [0.0,0.0,0.0], glMatrix.toRadian(0.5));
    }

    if(allPressedKeys[68] && allPressedKeys[16]){      // D => rotate right along Y (yaw)
        vec3.rotateY(lookAtV, lookAtV, [0.0,0.0,0.0], -glMatrix.toRadian(0.5));
    }

    if(allPressedKeys[87] && allPressedKeys[16]){      // W => rotate forward along X (pitch)
        vec3.rotateX(lookAtV, lookAtV, [0.0,0.0,0.0], glMatrix.toRadian(0.5));
        vec3.rotateX(lookUpV, lookUpV, [0.0, 0.0, 0.0], glMatrix.toRadian(0.5));
    }

    if(allPressedKeys[83] && allPressedKeys[16]){      // S => rotate backward along X (pitch)
        vec3.rotateX(lookAtV, lookAtV, [0.0,0.0,0.0], -glMatrix.toRadian(0.5));
        vec3.rotateX(lookUpV, lookUpV, [0.0, 0.0, 0.0], -glMatrix.toRadian(0.5));
    }

    if(allPressedKeys[188] && allPressedKeys[16]){      // < => perspective projection
       is_ortho = false;
    }

    if(allPressedKeys[187]){      // '=' => perspective projection
        is_ortho = true;
    }

    if(allPressedKeys[37]){      // '<- left arrow' => highlights previous model
        is_highlight = true;
        curr_model = curr_model-1;
        if (curr_model<0){
            curr_model = inputTriangles.length-1;
        }
        mat4.identity(transformM);
        mat4.translate(transformM, transformM, cent);
        mat4.scale(transformM, transformM, [1.2, 1.2, 1.2]);
        neg_cent = vec3.fromValues(-1.0*cent[0],-1.0*cent[1],-1.0*cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
        transformArray[curr_model] = transformM;

    }
    
    if(allPressedKeys[39]){      // '-> right arrow' => highlights next model
        is_highlight = true;
        curr_model = curr_model+1;
        if (curr_model>inputTriangles.length-1){
            curr_model = 0;
        }
        // transformM = transformArray[curr_model];
        mat4.identity(transformM);
        mat4.translate(transformM, transformM, cent);
        mat4.scale(transformM, transformM, [1.2, 1.2, 1.2]);
        neg_cent = vec3.fromValues(-1.0*cent[0],-1.0*cent[1],-1.0*cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
        // transformArray[curr_model] = transformM;
    }
    if(allPressedKeys[32]){      // 'Space' => unselect triangle set
        is_highlight = false;
    	mat4.translate(transformM, transformM, cent);
        mat4.scale(transformM, transformM, [-1.2, -1.2, -1.2]);
        neg_cent = vec3.fromValues(-1.0*cent[0],-1.0*cent[1],-1.0*cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
        // transformArray[curr_model] = transformM;
    }

    if(allPressedKeys[75] && is_highlight && !allPressedKeys[16]){      // 'k' => translate selection to left along X
        mat4.translate(transformM, transformM, [traslateBy, 0, 0]);
    }

    if(allPressedKeys[186] && is_highlight && !allPressedKeys[16]){      // ';' => translate selection to right along X
        mat4.translate(transformM, transformM, [-traslateBy, 0, 0]);
    }

    if(allPressedKeys[73] && is_highlight && !allPressedKeys[16]){      // 'i' => translate selection up along Y
        mat4.translate(transformM, transformM, [0, traslateBy, 0]);
    }

    if(allPressedKeys[80] && is_highlight && !allPressedKeys[16]){      // 'p' => translate selection down along Y
        mat4.translate(transformM, transformM, [0,-traslateBy, 0]);
    }

    if(allPressedKeys[79] && is_highlight && !allPressedKeys[16]){      // 'o' => translate selection forward along Z
        mat4.translate(transformM, transformM, [0,0,traslateBy]);
    }

    if(allPressedKeys[76] && is_highlight && !allPressedKeys[16]){      // 'l' => translate selection backward along Z
        mat4.translate(transformM, transformM, [0,0,-traslateBy]);
    }

    if(allPressedKeys[75] && allPressedKeys[16] && is_highlight){      // 'K' => rotate selection left along Y
        mat4.translate(transformM, transformM, cent);
        mat4.rotateY(transformM, transformM, glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[186] && allPressedKeys[16] && is_highlight){      // ':' => rotate selection right along Y
        mat4.translate(transformM, transformM, cent);
        mat4.rotateY(transformM, transformM, -glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[79] && allPressedKeys[16] && is_highlight){      // 'O' => rotate selection forward along X
        mat4.translate(transformM, transformM, cent);
        mat4.rotateX(transformM, transformM, glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[76] && allPressedKeys[16] && is_highlight){      // 'L' => rotate selection backward along X
        mat4.translate(transformM, transformM, cent);
        mat4.rotateX(transformM, transformM, -glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[73] && allPressedKeys[16] && is_highlight){      // 'I' => rotate clockwise left along Z
        mat4.translate(transformM, transformM, cent);
        mat4.rotateZ(transformM, transformM, glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    if(allPressedKeys[80] && allPressedKeys[16] && is_highlight){      // 'P' => rotate counter-clockwise right along Z
        mat4.translate(transformM, transformM, cent);
        mat4.rotateZ(transformM, transformM, -glMatrix.toRadian(0.5));
        neg_cent = vec3.fromValues(-cent[0],-cent[1],-cent[2]);
        mat4.translate(transformM, transformM, neg_cent);
    }

    transformArray[curr_model] = transformM;
}//end handleDownKey

function handleUpKey(event){
    allPressedKeys[event.keyCode] = false;
}

// read triangles in, load them into webgl buffers
function loadTriangles() {
    inputTriangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
    
    if (inputTriangles != String.null) { 
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords and its color attribute for WebGL
        var indexArray = [];// 1D array of traingle vertices
        var normalArray = [];
        var ambientArray = [];
        var diffuseArray = [];
        var specularArray = [];
        var nArray = [];
        var coord_index = new Map(); // hashmap to store the value vertexOffset for each vertex
        var idx = 0;
        tri_state = new Map(); //hashmap to store the centers of every triangle
        var set_count = -1;
        var center_vec = vec3.create();
        transformArray = [];
        var set_mapping = [];

        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            // set up the vertex and index array
            set_count += 1;
            var center_x = 0;
            var center_y = 0;
            var center_z = 0;
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++){

                center_x += inputTriangles[whichSet].vertices[whichSetVert][0];
                center_y += inputTriangles[whichSet].vertices[whichSetVert][1];
                center_z += inputTriangles[whichSet].vertices[whichSetVert][2];

                //if a given traingle vertex is not present in the hashap, defines a new index offset for that vertex
            	if (coord_index.has(inputTriangles[whichSet].vertices[whichSetVert])){
            		coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
            	}
            	else{
	            	coord_index.set(inputTriangles[whichSet].vertices[whichSetVert], idx++);
	                coordArray = coordArray.concat(inputTriangles[whichSet].vertices[whichSetVert]);
                }
                // console.log(inputTriangles[whichSet].vertices[whichSetVert]);
                //adds the normal vector for a particular vertex in normal array
                normalArray = normalArray.concat(inputTriangles[whichSet].normals[whichSetVert]);
                ambientArray = ambientArray.concat(inputTriangles[whichSet].material.ambient);
                diffuseArray = diffuseArray.concat(inputTriangles[whichSet].material.diffuse);
                specularArray = specularArray.concat(inputTriangles[whichSet].material.specular);
                nArray = nArray.concat(inputTriangles[whichSet].material.n);
                set_mapping = set_mapping.concat(set_count);
            }
            // calculates the centres of all the traingle sets
            //used for saving the state the triangle
            set_len = inputTriangles[whichSet].vertices.length;
            center_vec = vec3.fromValues(center_x/set_len,center_y/set_len,center_z/set_len);
            tri_state[set_count] = center_vec;
            var trans_id = mat4.create();
            transformArray = transformArray.concat(trans_id);

            // maintain an index array that stores unique indices for each vertex- handles common vertices
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++){
	        	for (var i = 0; i<3; i++){
	        		vertex_idx = inputTriangles[whichSet].vertices[inputTriangles[whichSet].triangles[whichSetTri][i]];

                    //adds the indexOffset to the index array
	        		indexArray = indexArray.concat(coord_index.get(vertex_idx));
	        	}
            }

        }// end for each triangle set 

        bindArrays();

function bindArrays(){
    
    vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW);

    
    ambientBuffer = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,ambientBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ambientArray),gl.STATIC_DRAW); 

  
    diffuseBuffer = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,diffuseBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(diffuseArray),gl.STATIC_DRAW); 

   
    specularBuffer = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,specularBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(specularArray),gl.STATIC_DRAW);

   
    nBuffer = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,nBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Uint16Array(nArray),gl.STATIC_DRAW); 

    normalBuffer = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normalArray),gl.STATIC_DRAW);

    
    setBuffer = gl.createBuffer(); // init empty vertex coord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER,setBuffer); // activate that buffer
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(set_mapping),gl.STATIC_DRAW);

    triBufferSize = indexArray.length;
    triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexArray), gl.STATIC_DRAW);
}
        
    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {
    
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        varying vec3 fragAmb;
        varying vec3 fragDiff;
        varying vec3 fragSpec;
        varying float fragN;
        varying vec3 fragNormal;
        varying vec3 fragPos;
        uniform vec3 eye;
        uniform vec3 light;

        void main(void) {
        	vec3 eyeP = normalize(eye-fragPos);
        	vec3 lightP = normalize(light-fragPos);
        	vec3 normal = normalize(fragNormal);
        	float NLd = dot(normal,lightP);
        	float NL = max(0.0,NLd);
        	vec3 H = normalize(lightP+eyeP);
        	float NH = dot(normal,H);
        	float NHn = max(0.0,pow(NH,fragN));
        	vec3 diffuseColor = fragDiff*NL;
        	vec3 specularColor = fragSpec*NHn;
        	vec3 rgb = fragAmb + diffuseColor + specularColor;
            gl_FragColor = vec4(rgb, 1.0);
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `
    	precision mediump float;

        attribute vec3 vertexPosition;
        attribute vec3 vertexNormal;
        attribute vec3 vertexAmb;
        attribute vec3 vertexDiff;
        attribute vec3 vertexSpec;
        attribute float vertexN;
        
        attribute float vertexSet;
        uniform float currModel;

        uniform mat4 transformMat;
        uniform mat4 viewM;
        uniform mat4 projM;

        
        varying vec3 fragAmb;
        varying vec3 fragDiff;
        varying vec3 fragSpec;
        varying float fragN;
        varying vec3 fragPos;
        varying vec3 fragNormal;

        void main(void) {
        	fragAmb = vertexAmb;
        	fragDiff = vertexDiff;
        	fragSpec = vertexSpec;
        	fragNormal = vertexNormal;
        	fragPos = vertexPosition;
        	fragN = vertexN;
            mat4 transM;

            if(currModel != vertexSet)
                transM = mat4(1,0,0,0,
                              0,1,0,0,
                              0,0,1,0,
                              0,0,0,1);
            else
                transM = transformMat;

            gl_Position = projM * viewM * transM * vec4(vertexPosition, 1.0);

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

                eyeUniform = gl.getUniformLocation(shaderProgram, "eye");
                lightUniform = gl.getUniformLocation(shaderProgram, "light");
                transformUniform = gl.getUniformLocation(shaderProgram, "transformMat");
                viewUniform = gl.getUniformLocation(shaderProgram, "viewM");
                projUniform = gl.getUniformLocation(shaderProgram, "projM");
                // transformSetUniform = gl.getUniformLocation(shaderProgram, "transformSet");
                currModelUniform = gl.getUniformLocation(shaderProgram, "currModel");

                vertexPositionAttrib = gl.getAttribLocation(shaderProgram, "vertexPosition"); // get pointer to vertex shader input 
                    gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexAmbAttrib = gl.getAttribLocation(shaderProgram, "vertexAmb");
                	gl.enableVertexAttribArray(vertexAmbAttrib);
                
                vertexDiffAttrib = gl.getAttribLocation(shaderProgram, "vertexDiff");
                	gl.enableVertexAttribArray(vertexDiffAttrib);

                vertexSpecAttrib = gl.getAttribLocation(shaderProgram, "vertexSpec");
                	gl.enableVertexAttribArray(vertexSpecAttrib);

                vertexNAttrib = gl.getAttribLocation(shaderProgram, "vertexN");
                	gl.enableVertexAttribArray(vertexNAttrib);

                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                	gl.enableVertexAttribArray(vertexNormalAttrib);

                vertexSetAttrib = gl.getAttribLocation(shaderProgram, "vertexSet");
                    gl.enableVertexAttribArray(vertexSetAttrib);

            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// initializes values for View and Proj matrices
function initProjView(){
    viewM = new Float32Array(16);
    projM = new Float32Array(16);

    Center = vec3.add(Center, Eye, lookAtV);
    if (!is_ortho)
       mat4.perspective(projM, glMatrix.toRadian(90), canvas.width/canvas.height, Near, Far);
    if(is_ortho)
        mat4.ortho(projM,-1,1,-1,1, Near, Far);
    mat4.lookAt(viewM, Eye,Center,lookUpV);
}// end init Proj View

// binds all buffers to particular vertex position attributes
function bindAllBuffers () {
    // vertex buffer: activate and feed into vertex shader
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
    gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false, 0,0); // feed
    //defines the color for each vertex
    gl.bindBuffer(gl.ARRAY_BUFFER,diffuseBuffer); // activate
    gl.vertexAttribPointer(vertexDiffAttrib,3,gl.FLOAT,false, 0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,setBuffer); // activate
    gl.vertexAttribPointer(vertexSetAttrib,1,gl.FLOAT,false, 0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,specularBuffer); // activate
    gl.vertexAttribPointer(vertexSpecAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,ambientBuffer); // activate
    gl.vertexAttribPointer(vertexAmbAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,nBuffer); // activate
    gl.vertexAttribPointer(vertexNAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer); // activate
    gl.vertexAttribPointer(vertexNormalAttrib,3,gl.FLOAT,false,0,0); // feed

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer);//index buffer activate
    gl.drawElements(gl.TRIANGLES,triBufferSize,gl.UNSIGNED_SHORT,0); // render
}// end bind all Buffers

var bgColor = 0;
// render the loaded model
function renderTriangles() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    // bgColor = (bgColor < 1) ? (bgColor + 0.001) : 0;
    gl.clearColor(bgColor, 0, 0, 1.0);
    requestAnimationFrame(renderTriangles);

    initProjView();
    gl.uniformMatrix4fv(transformUniform,gl.False, transformM);
    gl.uniformMatrix4fv(projUniform, gl.False, projM);
    gl.uniformMatrix4fv(viewUniform, gl.False, viewM);
    gl.uniform3fv(eyeUniform, Eye);
    gl.uniform3fv(lightUniform, Light);
    // gl.uniform4fv(transformSetUniform, transformArray);
    gl.uniform1f(currModelUniform, curr_model);

    bindAllBuffers();

} // end render triangles
/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadTriangles(); // load in the triangles from tri file
  setupShaders(); // setup the webGL shaders
  renderTriangles(); // draw the triangles using webGL
  
} // end main

//references
// http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/
// https://en.wikibooks.org/wiki/GLSL_Programming/Vector_and_Matrix_Operations
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
// https://web.archive.org/web/20180111144856/http://learningwebgl.com/blog/?p=571
// https://web.archive.org/web/20180209103740/http://learningwebgl.com/blog/?page_id=1217