class Vector{
	constructor(x,y,z){
		this.x = x;
		this.y = y;
		this.z = z;
	}

	static dot(v1,v2) {
    	return(v1.x*v2.x + v1.y*v2.y + v1.z*v2.z);
	}    

	static add(v1, v2){
		return (new Vector(v1.x+v2.x, v1.y+v2.y, v1.z+v2.z));
	}

	static sub(v1, v2){
		return (new Vector(v1.x-v2.x, v1.y-v2.y, v1.z-v2.z))
	}

	static scale(c,v) {
            return(new Vector(c*v.x,c*v.y,c*v.z));
  
    }
    static normalize(v){
    	var lenDenom = 1/Math.sqrt(Vector.dot(v,v));
        return(Vector.scale(lenDenom,v));
    }

    static cross(v1,v2){
		var crossX = v1.y*v2.z - v1.z*v2.y;
		var crossY = v1.z*v2.x - v1.x*v2.z;
		var crossZ = v1.x*v2.y - v1.y*v2.x;
		return(new Vector(crossX,crossY,crossZ));
    }
}