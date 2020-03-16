function getInputBoxes() {
    const INPUT_BOXES_URL = 
        "https://ncsucgclass.github.io/prog1/boxes.json";
        
    // load the boxes file
    var httpReq = new XMLHttpRequest(); // a new http request
    httpReq.open("GET",INPUT_BOXES_URL,false); // init the request
    httpReq.send(null); // send the request
    var startTime = Date.now();
    while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
        if ((Date.now()-startTime) > 3000)
            break;
    } // until its loaded or we time out after three seconds
    if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE)) {
        console.log*("Unable to open input boxes file!");
        return String.null;
    } else
        return JSON.parse(httpReq.response); 
} 
function drawPixel(imagedata,x,y,color) {

    var pixelindex = (y*imagedata.width + x) * 4;
    imagedata.data[pixelindex] = color.r;
    imagedata.data[pixelindex+1] = color.g;
    imagedata.data[pixelindex+2] = color.b;
    imagedata.data[pixelindex+3] = color.a;

}
function calcP(screen, s, t){
    //calculates the z coordinate of the point given, values of s,t
    var pl = Vector.add(screen.ul, Vector.scale(s, Vector.sub(screen.ll, screen.ul)));
    var pr = Vector.add(screen.ur, Vector.scale(s, Vector.sub(screen.lr, screen.ur)));
    var pz = Vector.add(pl, Vector.scale(t, Vector.sub(pr, pl)));
    return pz;
}


function findTaxis(view, inputBoxes, D, axis, box){
    //finds t-values for every axis
    if (axis == 'y'){
        var by = inputBoxes[box].by;
        var ty = inputBoxes[box].ty;
        
        var tby = (by - view.eye.y) / D.y;
        var tty = (ty - view.eye.y) / D.y;

        if(tby<tty){
            ty0 = tby;
            var intersecSurface = 'by';
        }
        else{
            ty0 = tty;
            var intersecSurface = 'ty';
        }
        ty1 = Math.max(tby, tty);

        return [ty0, ty1, intersecSurface];
        
    }

    else if (axis == 'x') {
        var lx = inputBoxes[box].lx;
        var rx = inputBoxes[box].rx;
        
        var tlx = (lx - view.eye.x) / D.x;
        var trx = (rx - view.eye.x) / D.x;
        
        if(tlx<trx){
            tx0 = tlx;
            var intersecSurface = 'lx';
        }
        else{
            tx0 = trx;
            var intersecSurface = 'rx';
        }
        
        tx1 = Math.max(tlx, trx);
        
        return [tx0, tx1, intersecSurface];
        
    }

    else{
        var fz = inputBoxes[box].fz;
        var rz = inputBoxes[box].rz;
        
        var tfz = (fz - view.eye.z) / D.z;
        var trz = (rz - view.eye.z) / D.z;
        
        if(tfz<trz){
            tz0 = tfz;
            var intersecSurface = 'fz';
        }
        else{
            tz0 = trz;
            var intersecSurface = 'rz';
        }
        tz1 = Math.max(tfz, trz);
        
        return [tz0, tz1, intersecSurface];
        
    }
}

function findT (tx, ty, tz, D) {
    //finds the value of t0, t1 and records the surface with which the ray intersects
    var t0 = Number.MIN_VALUE;
    var t1 = Number.MAX_VALUE;
    var intersecSurface = '';

    if (D.x != 0 || tx[0] != Number.POSITIVE_INFINITY || tx[0] != Number.NEGATIVE_INFINITY){
        if(tx[0] > t0){
            t0 = tx[0];
            intersecSurface = tx[2];
        }
        
    }
    if (D.y != 0 || ty[0] != Number.POSITIVE_INFINITY || ty[0] != Number.NEGATIVE_INFINITY){
        if(ty[0] > t0){
            t0 = ty[0];
            intersecSurface = ty[2];
        }
        
    }
    if (D.z != 0 || tz[0] != Number.POSITIVE_INFINITY || tz[0] != Number.NEGATIVE_INFINITY){
        if(tz[0] > t0){
            t0 = tz[0];
            intersecSurface = tz[2];
        }
        
    }

    t1 = Math.min(tx[1], ty[1], tz[1]);
    return ([t0, t1, intersecSurface]); 
}

function findNormal (intersecSurface) {
    //checks the intersection surface and then returns the respective Normal vector of that surface
    var N;
    switch (intersecSurface) {
        case 'lx':
            N = new Vector(-1,0,0);
            break;
        case 'rx':
            N = new Vector(1,0,0);
            break;
        case 'by':
            N = new Vector(0,-1,0);
            break;
        case 'ty':
            N = new Vector(0,1,0);
            break;
        case 'fz':
            N = new Vector(0,0,-1);
            break;
        case 'rz':
            N = new Vector(0,0,1);
            break;
    }

    return N
}

function findColor (inputBoxes, NL, NHn, box_min, material, lighting) {

    if(lighting){
        //finds the r,g,b values based on blinn-phong illumination formula
        var r = Math.max(0, material.a*inputBoxes[box_min].ambient[0]) + 
                Math.max(0, material.d*inputBoxes[box_min].diffuse[0]*NL) +
                Math.max(0, material.s*inputBoxes[box_min].specular[0]*NHn);

        var g = Math.max(0, material.a*inputBoxes[box_min].ambient[1]) + 
                Math.max(0, material.d*inputBoxes[box_min].diffuse[1]*NL) +
                Math.max(0, material.s*inputBoxes[box_min].specular[1]*NHn);
        
        var b = Math.max(0, material.a*inputBoxes[box_min].ambient[2]) + 
                Math.max(0, material.d*inputBoxes[box_min].diffuse[2]*NL) +
                Math.max(0, material.s*inputBoxes[box_min].specular[2]*NHn); 
    }
    else{
        //r,g,b values for Part 1 of the program
        var r = inputBoxes[box_min].diffuse[0];
        var g = inputBoxes[box_min].diffuse[1];
        var b = inputBoxes[box_min].diffuse[2];
    }
    var color = new Color(r*255,g*255,b*255,255);
    return color;

}

function findV (view, intersecPoint) {
    //computes the vector from intersectionPoint to the eye
    V = Vector.sub(view.eye, intersecPoint);
    return V;
}

function findintersecPoint (view, t_min, eye2P) {
    //computes the vector from eye to the intersection point on the object
    intersecPoint = Vector.add(view.eye, Vector.scale(t_min, eye2P));
    return intersecPoint;
}

function findL (light, intersecPoint) {
    //computes the light vector from intersection point to the light source
    L = Vector.sub(light, intersecPoint);
    return L;
}

function raycast(context, imagedata, screen, view, light, material, lighting){
    //implements the raycast algorithm
    var inputBoxes = [
{"lx": 0.11, "rx": 0.17, "by": 0.04, "ty": 0.11, "fz":0.09, "rz":0.15, "ambient": [1.2,0.1,0.1], "diffuse": [1.3,0.0,0.6], "specular": [2,0.3,0.3], "n":5},
{"lx": 0.35, "rx": 0.44, "by": 0.13, "ty": 0.24, "fz":0.05, "rz":0.08, "ambient": [0.1,0.1,0.1], "diffuse": [0.0,0.6,0.0], "specular": [0.3,0.3,0.3], "n":7}
];
    var width = context.canvas.width; 
    var height = context.canvas.height;

    for(let row = 0; row < height; row++){
        for(let col = 0; col<width; col++){

            var s = row / height;
            var t = col / width;

            var P = calcP(screen, s, t);
            var eye2P = Vector.sub(P,view.eye);

            var t_min = Number.MAX_VALUE;
            var box_min = 0;
            var intersecSurface = '';

            for(let box = 0; box < inputBoxes.length; box++){

                tx = findTaxis(view, inputBoxes, eye2P, 'x', box);
                ty = findTaxis(view, inputBoxes, eye2P, 'y', box);
                tz = findTaxis(view, inputBoxes, eye2P, 'z', box);


                var t_point = findT(tx, ty, tz, eye2P);

                if (t_point[0] <= t_point[1] && t_point[0] >= 1){
                    if (t_point[0] < t_min){
                        t_min = t_point[0];
                        box_min = box;
                        intersecSurface = t_point[2];
                    }
                }
                
            }

            if(t_min != Number.MAX_VALUE){

                intersecPoint = findintersecPoint(view, t_min, eye2P);
                N = findNormal(intersecSurface);
                V = Vector.normalize(findV(view, intersecPoint));
                L = Vector.normalize(findL(light, intersecPoint));
                NL = Vector.dot(N,L);
                H = Vector.normalize(Vector.add(V, L));
                NHn = Math.pow(Vector.dot(N, H), inputBoxes[box_min].n);
                color = findColor(inputBoxes, NL, NHn, box_min, material, lighting);
                drawPixel(imagedata, col, row, color);     
            }
            else{
               drawPixel(imagedata, col, row, new Color(0,0,0,255));
            }
        }
    }
    context.putImageData(imagedata, 0,0);
}   

function screenCoords (view,eye2screen, winH, winW, center) {
    //computes the corners of the screen
    right = Vector.cross(view.viewUp, view.lookAt);
    screen = { ul: Vector.add(center, Vector.add(Vector.scale(-winW/2, right), Vector.scale(winH/2, view.viewUp))),
               ur: Vector.add(center, Vector.add(Vector.scale(winW/2, right), Vector.scale(winH/2, view.viewUp))),
               ll: Vector.add(center, Vector.add(Vector.scale(-winW/2, right), Vector.scale(-winH/2, view.viewUp))),
               lr: Vector.add(center, Vector.add(Vector.scale(winW/2, right), Vector.scale(-winH/2, view.viewUp))),
             };

    return screen;
}
function main(){

	var canvas = document.getElementById("viewport");
	var context = canvas.getContext("2d");
    var w = context.canvas.width;
    var h = context.canvas.height;
    var imagedata = context.createImageData(w,h);

    var eye = new Vector(0.5,0.5,-0.5);
    var viewUp = new Vector(0,1,0);
    var lookAt = new Vector(0,0,1);
    var view = {eye:eye, lookAt:lookAt, viewUp:viewUp};
    var eye2screen = 0.5;
    var center = new Vector(0.5, 0.5, 0);
    var winH = 1;
    var winW = 1;

    var light = new Vector(-0.5, 1.5, -0.5);
    var material = {a: 1, d: 1, s: 1};
    var lighting = true; //decides whether to implement blinn-phong illumniation or not
    
    screen = screenCoords(view, eye2screen, winH, winW, center)
    raycast(context, imagedata, screen, view, light, material, lighting);
}   