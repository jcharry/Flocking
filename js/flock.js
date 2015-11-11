//Based on http://www.kfish.org/boids/pseudocode.html

var Flock = function(scene, octree, obstacles, flock) {
  this.flock = flock;
  //this.flock_size = flock.length;
  this.scene = scene;
  this.octree = octree;
  this.obstacles = obstacles;
  //this.center;
  //this.avg_vel;
  this.velocity_hash = new Hashtable();
  this.birds = this.init_flock();
  this.update_center();
  this.time_step = 0;
};

Flock.prototype.init_flock = function(data) {
  var birds = [];
  for (var i = 0; i < this.flock.length; i++) {
    var position = new THREE.Vector3((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
    var orientation = new THREE.Vector3(0, Math.random()*2*Math.PI, 0);
    var name = this.flock[i].get('name');
    var emotion = this.flock[i].get('emotion');
    var location = this.flock[i].get('location');
    var bird = new Bird(this.scene, this.octree, this.obstacles, this.velocity_hash, position, orientation, name, emotion, location);
    birds.push(bird);
  }
  return birds;
};

Flock.prototype.update = function(elapsed_time) {
	this.update_center();
	this.update_velocities();
	if (this.time_step%5 === 0) {
		this.octree.update();
	}
	for (var i = 0; i < this.flock.length; i++) {
		var bird = this.birds[i];
		bird.update_forces();
		bird.update_position(elapsed_time, this.center);
	}
	this.time_step++;
};

Flock.prototype.update_velocities = function() {
  for (var i = 0; i < this.birds.length; i++) {
    var mesh = this.birds[i].mesh;
    var velocity = this.birds[i].velocity;
    this.velocity_hash.put(mesh, velocity);
  }
};

Flock.prototype.update_center = function() {
  var center = new THREE.Vector3(0, 0, 0);
  var avg_vel = new THREE.Vector3(0, 0, 0);

  for (var i = 0; i < this.flock.length; i++) {
    var current_bird = this.birds[i];
    center = center.add(current_bird.mesh.position);
    avg_vel = avg_vel.add(current_bird.velocity);
  }
  center = center.divideScalar(this.flock.length);
  avg_vel = avg_vel.divideScalar(this.flock.length);

  this.center = center;
  this.avg_vel = avg_vel;
};

Flock.prototype.change_separation = function(value) {
  this.birds.forEach(function(bird) {
    bird.separation_gain = value;
  });
};

Flock.prototype.change_cohesion = function(value) {
  this.birds.forEach(function(bird) {
    bird.cohesion_gain = value;
  });
};

Flock.prototype.change_alignment = function(value) {
  this.birds.forEach(function(bird) {
    bird.alignment_gain = value;
  });
};

Flock.prototype.change_min_velocity = function(value) {
  this.birds.forEach(function(bird) {
    bird.min_velocity = value;
  });
};

Flock.prototype.change_max_velocity = function(value) {
  this.birds.forEach(function(bird) {
    bird.max_velocity = value;
  });
};

Flock.prototype.change_bound_strength = function(value) {
  this.birds.forEach(function(bird) {
    bird.bound_strength = value;
  });
};

Flock.prototype.change_max_climb = function(value) {
  this.birds.forEach(function(bird) {
    bird.max_climb = value;
  });
};



