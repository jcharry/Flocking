var Bird = function(scene, octree, velocity_hash, position, orientation) {
	this.scene = scene;
	this.octree = octree;
	this.velocity_hash = velocity_hash;
	this.line;
	this.sphere;
	this.mesh;
	this.init_mesh(position, orientation);
	this.separation_size = 1;
	this.acceleration = new THREE.Vector3(0, 0, 0);
	this.min_speed = 1;
	this.max_speed = 10;
	this.max_delta = .01;
	this.velocity = new THREE.Vector3(this.min_speed*Math.cos(this.mesh.rotation.y), 0, this.min_speed*Math.sin(this.mesh.rotation.y));
}

Bird.prototype.init_mesh = function(position, orientation) {
	var geometry = new THREE.CylinderGeometry(.1, .4, 1, 10, 2);
	var material = new THREE.MeshLambertMaterial({color: this.get_random_color()});
	var mesh = new THREE.Mesh(geometry, material);


	var rot_mat = new THREE.Matrix4();
	rot_mat.setRotationFromEuler(new THREE.Vector3(0, 0, -Math.PI/2));//rotate on X 90 degrees
	geometry.applyMatrix(rot_mat);

	mesh.position = position;
	mesh.rotation = orientation;
	this.mesh = mesh;
	this.scene.add(this.mesh);
	this.octree.add(this.mesh);

	// var line_material = new THREE.LineBasicMaterial({
 //        color: 0x999999
 //    });

 //    var line_geometry = new THREE.Geometry();
 //    line_geometry.dynamic = true;
 //    line_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
 //    line_geometry.vertices.push(new THREE.Vector3(0, 0, 0));

 //    this.line = new THREE.Line(line_geometry, line_material);
 //    this.scene.add(this.line);

    var sphere_material = new THREE.MeshBasicMaterial({
    	color: 0xaaaaaa,
        wireframe: true
    });

    var sphere_geometry = new THREE.SphereGeometry(3, 8, 8);

    this.sphere = new THREE.Mesh(sphere_geometry, sphere_material);

};

Bird.prototype.update_position = function(elapsed_time, lookAt) {
	// this.apply_limit(this.acceleration, this.max_delta);
	this.velocity.add(this.acceleration);
	this.apply_limit(this.velocity, this.min_speed, this.max_speed);

	var displacement = new THREE.Vector3();
	displacement.copy(this.velocity);
	displacement.multiplyScalar(elapsed_time/1000);

	this.mesh.position.add(displacement);

	this.mesh.rotation.y = Math.atan2(-this.velocity.z, this.velocity.x);


	// //Drawing lines
	// this.line.geometry.vertices[0] = this.mesh.position;
	// this.line.geometry.vertices[1] = lookAt;
	// this.line.geometry.verticesNeedUpdate = true;

	this.sphere.position = this.mesh.position;
	this.sphere.rotation = this.mesh.rotation;

	this.acceleration.set(0, 0, 0);

};

Bird.prototype.apply_limit = function(vector, min, max) {
	if (vector.length() > max) {
		vector.normalize();
		vector.multiplyScalar(max);
	}
	
	if (vector.length() < min) {
		vector.normalize();
		vector.multiplyScalar(min);
	}

};

Bird.prototype.update_forces = function() {
	var v1, v2, v3;

	v1 = this.cohesion();
	v2 = this.separation();
	v3 = this.alignment();

	this.apply_force(v1);
	this.apply_force(v2);
	this.apply_force(v3);
};

Bird.prototype.cohesion = function() {
	var flock_size = this.octree.objects.length;
	var v1 = new THREE.Vector3(0, 0, 0);

	var search = this.octree.search(this.mesh.position, 10);

	for (var i = 0; i < search.length; i++) {
		if (search[i].object == this.mesh || this.mesh.position.angleTo(search[i].position) > Math.PI) continue;

		// console.log(this.mesh.position.angleTo(search[i].position)); 

		v1.add(search[i].position);
	}

	v1.divideScalar(search.length);

	v1.sub(this.mesh.position);
	v1.divideScalar(50);

	return v1;
};

Bird.prototype.separation = function() {
	var v2 = new THREE.Vector3(0, 0, 0);

	var search = this.octree.search(this.mesh.position, this.separation_size);

	for (var i = 0; i < search.length; i++) {
		if (search[i].object == this.mesh || this.mesh.position.angleTo(search[i].position) > Math.PI) continue;

		var offset = new THREE.Vector3(0, 0, 0);
		offset.subVectors(search[i].object.position, this.mesh.position);
		v2.sub(offset);
	}
	v2.divideScalar(300);
	return v2;
};

Bird.prototype.alignment = function() {
	var v3 = new THREE.Vector3(0, 0, 0);

	var search = this.octree.search(this.mesh.position, 5);

	for (var i = 0; i < search.length; i++) {
		if (search[i].object == this.mesh || this.mesh.position.angleTo(search[i].position) > Math.PI) continue;

		var current_bird = search[i].object;
		var velocity = this.velocity_hash.get(current_bird);
		v3 = v3.add(velocity);
	}

	v3.divideScalar(search.length-1);

	v3.sub(this.velocity);

	return v3.divideScalar(100);
};

Bird.prototype.apply_force = function(force) {
	this.acceleration.add(force);
};

Bird.prototype.get_random_color = function () {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}