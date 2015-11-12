var World = function() {};

World.prototype.init = function() {

	this.renderer = this.init_renderer();

	//this.render_stats;
	//this.init_stats();

	this.scene = this.init_scene();

	this.camera = this.init_camera();
	this.camera_rotation = Math.PI/180*90;
	this.camera.position = new THREE.Vector3(0, 20, -30);
	this.camera_radius = 50;

	this.lights = this.init_lights();

	this.keyboard = new THREEx.KeyboardState();

	this.controls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
	this.controls.rotateSpeed = 1.0;
	this.controls.zoomSpeed = 0.6;
	this.controls.panSpeed = 2;
	this.controls.noZoom = false;
	this.controls.noPan = false;
	this.controls.staticMoving = false;
	this.controls.dynamicDampingFactor = 0.3;
	this.controls.target = new THREE.Vector3(0, 0, 0);

	this.octree = new THREE.Octree({
	    radius: 1, // optional, default = 1, octree will grow and shrink as needed
	    depthMax: -1, // optional, default = -1, infinite depth
	    objectsThreshold: 8, // optional, default = 8
	    overlapPct: 0.15, // optional, default = 0.15 (15%), this helps sort objects that overlap nodes
	    scene: null// optional, pass scene as parameter only if you wish to visualize octree
	} );

//	this.obstacles;

	this.flock = new Flock(this.scene, this.octree, this.obstacles, nodes);

	this.last_time = new Date();

	this.elapsed_time = 0;

	this.ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 50, 50), new THREE.MeshLambertMaterial({color: 0x0000DD, wireframe: true}));
	this.ground.rotation.set(-90*Math.PI/180, 0, 0);
	this.ground.position.set(0, -10, 0);
//	this.scene.add(this.ground);

	console.log(this.octree);

	//DAT GUI VARIABLES
	this.gui = new dat.GUI();

	this.draw_octree = function() {
		this.octree.scene = this.scene;
	};
	var octree_control = this.gui.add(this, 'draw_octree');

	this.separation = 0.2;  //default - 1
	this.cohesion = 1.5;    //default - 1
	this.alignment = 3;   //default - 1
	this.min_velocity = 1;	//default - 6
	this.max_velocity = 2;	//default - 10
	this.bound_strength = 1; //default - 1
	this.max_climb = 15;	    //default - 1

	console.log(this.gui.addFolder);	

	this.bc = this.gui.addFolder("Bird Controls");
	this.separation_control = this.bc.add(this, "separation", 0, 30);
	this.cohesion_control = this.bc.add(this, "cohesion", 0, 30);
	this.alignment_control = this.bc.add(this, "alignment", 0, 30);
	this.min_velocity_control = this.bc.add(this, "min_velocity", 0, 7);
	this.max_velocity_control = this.bc.add(this, "max_velocity", 0, 15);
	this.bound_strength_control = this.bc.add(this, "bound_strength", 0, 30);
	this.max_climb_control = this.bc.add(this, "max_climb", 0, 30);
	this.bc.open();
	var self = this;

	this.separation_control.onFinishChange(function(value) {
		self.flock.change_separation(value);
	});
	this.cohesion_control.onFinishChange(function(value) {
		self.flock.change_cohesion(value);
	});
	this.alignment_control.onFinishChange(function(value) {
		self.flock.change_alignment(value);
	});
	this.min_velocity_control.onFinishChange(function(value) {
		self.flock.change_min_velocity(value);
	});
	this.max_velocity_control.onFinishChange(function(value) {
		self.flock.change_max_velocity(value);
	});
	this.bound_strength_control.onFinishChange(function(value) {
		self.flock.change_bound_strength(value);
	});
	this.max_climb_control.onFinishChange(function(value) {
		self.flock.change_max_climb(value);
	});


	requestAnimationFrame(this.render.bind(this));

	window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
};

World.prototype.init_renderer = function() {
	var renderer =  new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.setClearColorHex( 0xEEEEEE, 1 );
	renderer.domElement.id = "world";
	renderer.domElement.style.position = "absolute";
	renderer.domElement.style.zIndex   = 0;
	document.body.appendChild(renderer.domElement);
	return renderer;
};

World.prototype.onWindowResize = function() {
	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );
};

//World.prototype.init_stats = function() {
//	this.render_stats = new Stats();
//	this.render_stats.domElement.style.position = 'absolute';
//	this.render_stats.domElement.style.top = '1px';
//	this.render_stats.domElement.style.zIndex = 100;
//
//	this.render_stats.domElement.hidden = false;
//	document.body.appendChild(this.render_stats.domElement);
//};

World.prototype.update_time = function() {
	var now = new Date();
	this.elapsed_time = now - this.last_time;
	this.last_time = now;
};

World.prototype.init_scene = function() {
	var scene = new THREE.Scene({ fixedTimeStep: 1 / 120 });
	scene.fog = new THREE.FogExp2( 0xcccccc, 0.005 );
	return scene;
};

World.prototype.init_camera = function() {
	var WIDTH = window.innerWidth,
	    HEIGHT = window.innerHeight;

	var VIEW_ANGLE = 45,
	    ASPECT = WIDTH / HEIGHT,
	    NEAR = 0.1,
	    FAR = 10000;
	var camera = new THREE.PerspectiveCamera(  VIEW_ANGLE,
                                ASPECT,
                                NEAR,
                                FAR  );
	camera.position.set( 0, 50, 0);
	camera.lookAt(new THREE.Vector3(0, 0, 0) );
	camera.h_rotation = 0;

	this.scene.add(camera);

	return camera;
};

World.prototype.init_lights = function() {
  var lights = [];
  // Light
  var d_light = new THREE.DirectionalLight( 0xFFFFFF );
  d_light.position.set( 300, 200, 300 );
  d_light.intensity = 0.7;
  d_light.target.position.set(0, 0, 0);
  d_light.castShadow = true;
  d_light.shadowBias = -0.0001;
  d_light.shadowMapWidth = d_light.shadowMapHeight = 2048;
  d_light.shadowDarkness = 0.7;
  
  lights.push(d_light);

  var s_light = new THREE.SpotLight( 0xFFFFFF);
  s_light.position.set( 0, 400, 200 );
  s_light.target.position.copy( this.scene.position );
  s_light.castShadow = true;
  s_light.intensity = 0.8;
  s_light.shadowDarkness = 0.7;

  lights.push(s_light);

  for (var i = 0; i < lights.length; i++) {
	  this.scene.add(lights[i]);
  }

  return lights;
};

World.prototype.handle_keys = function() {
  if (this.keyboard.pressed("1")) {
	  this.render_stats.domElement.hidden = false;
  }
  if (this.keyboard.pressed("a")) {
	  this.camera_rotation += 0.05;
  }
  if (this.keyboard.pressed("d")) {
	  this.camera_rotation -= 0.05;
  }
  if (this.keyboard.pressed("w")) {
	  this.camera_radius -= 0.5;
  }
  if (this.keyboard.pressed("s")) {
	  this.camera_radius += 0.5;
  }

};

var theta = 0;
World.prototype.update_camera = function() {
  
  //this.camera.position.x = this.camera_radius*Math.cos(theta);
  //this.camera.position.y = this.camera_radius*Math.sin(theta);
  //this.camera.position.z = this.flock.center.z;
  //theta += 0.001;

  //this.camera.position.x = this.flock.center.x;
  //this.camera.position.z = this.flock.center.z;
  this.camera.lookAt(this.flock.center);
  //this.camera.lookAt(new THREE.Vector3(0, 0, 0));
};


World.prototype.render = function() {
	this.update_time();
	this.handle_keys();
	this.controls.update();
	this.update_camera();
	this.flock.update(this.elapsed_time);	
	this.renderer.render( this.scene, this.camera );
	//this.render_stats.update();
	requestAnimationFrame( this.render.bind(this) );
};


// Parse
Parse.initialize("xa0SQKjqG0GNFMiaAoprMRrPyVVkIfMGMmBHhsKw", "fqrWimXMv1DAmVhh7YuOogp77xhINze5aKrLC8u8");

// Fetch data from parse
var nodes = [];
function fetchNodes() {
  // Load Parse Data
  var PNode = Parse.Object.extend('Node'); 
  var query = new Parse.Query(PNode);
  query.find({
    
    success: function(results) {
      console.log('successfully retrieved ' + results.length + ' items');
      for (var i = 0; i < results.length; i++) {
	var object = results[i];
	var n = object.get('name');
	
	if (n.length === 0) {
	  n = 'anon';
	}
	var e = object.get('emotion');
	var l = object.get('location');
	nodes.push(object);
      }
      // After all nodes have loaded, init scene
      startWorld();
    },
    error: function(error) {
      alert('error: ' + error.code + ' ' + error.message);
    }
  });
}
fetchNodes();

var worldLoaded = false;
function startWorld() {
  initWorld();
  if (!worldLoaded) {
    addButton();
    worldLoaded = true;
  }
}

var myPosition;
$('document').ready(function() {
  initDialog();
  if (navigator.geolocation) {
    myPosition = navigator.geolocation.getCurrentPosition(function(position) {
      myPosition = position;
    });
  } else {
    myPosition = 'unknown';
  }
});

var world = new World();
// We can lose reference to the original object,
// so using bind allows us to know that 'this' refers to the specific object we want
// in this case 'world'
var initWorld = world.init.bind(world);
//window.addEventListener("load", world.init.bind(world));

//window.addEventListener("load", world.init());

function initDialog() {
  // Initialize Dialog box
  $('#dialog').dialog({
    autoOpen: false,
    show: {
      effect: 'fade',
      duration: 1000
    },
    modal: true,
    draggable: false,
    hide: {
      effect: 'fade',
      duration: 1000
    },
    resizable: false
  });
}

function addButton() {
  var $addNodeButton = $('<button id=\'addNodeButton\'>How do you feel?</button>');
  $addNodeButton.mousedown(openDialog);
  $addNodeButton.css('position','absolute');
  $addNodeButton.css('left','20px');
  $addNodeButton.css('top','20px');
  $('body').append($addNodeButton);

  $('#submitNode').mousedown(saveNode);
  $('#cancelDialog').mousedown(closeDialog);
}

function saveNode() {
  // Save node to parse - when save is done, query again for all nodes and display them on the screen
  // get name and emotion and log time
 
  if (myPosition) {
    var PNode = Parse.Object.extend("Node");
    var node = new PNode();
    node.set('name',$('#nameInput').val());
    node.set('emotion',$('#emotionSelector').val());
    node.set('time',new Date());
    node.set('location', myPosition);

    world.flock.addBird(node);
    //world.flock.flock.push(node);
    node.save(null,{
      success: function(object) {
        console.log(object);
        console.log('saved succeeded');
        $('#dialog').dialog('close');
      },  
      error: function(object, error) {
        console.log(error);
      }   
    }); 
  } else {
    alert('Unable to get your position, try again');
  }   
}


function openDialog() {
  $('#dialog').dialog('open');
}
function closeDialog() {
  $('#dialog').dialog('close');
}


