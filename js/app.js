var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { 
	preload: preload, 
	create: create, 
	update: update, 
	render: render 
});

WebFontConfig = {

		active: function() { game.time.events.add(Phaser.Timer.SECOND, createHUD, this); },

    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
      families: ['Orbitron']
    }

};

function preload() {

	game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
}

var ball;
var base;
var cannon;
var bullet;
var cursors;

var hit = 0;
var missed = 0;

var hitText;
var missedText;


function create() {

	// Enable p2 physics engine and set some 
	// model parameters.
	//
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.gravity.y = 100;
  game.physics.p2.restitution = 0.9;

	game.stage.backgroundColor = '#11ea3f';

	// Create the falling ball.
	//
	createBall();

	// Create the cannon.
	//
	createCannon();

	// Enable cursor keys.
	//
	cursors = game.input.keyboard.createCursorKeys();
	spacebar = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

	// Enable mouse pointer movement tracking.
	//
	game.input.addMoveCallback(pointerMove, this);
}

function createHUD() {

	hitText = game.add.text(10, 10, "HIT: " + pad(hit.toString()));
	hitText.font = 'Orbitron';
	missedText = game.add.text(550, 10, "MISS: " + pad(missed.toString()));
	missedText.font = 'Orbitron';
}

function updateHUD() {

	hitText.setText("HIT: " + pad(hit.toString()));
	missedText.setText("MISS: " + pad(missed.toString()));
}

function pointerMove(pointer, x, y) {

	var angle = game.math.angleBetween(x, y, 800, 600);
	cannon.body.rotation = angle;
}

function createBall() {

	var bmd = game.make.bitmapData(50, 50);
	
	var gradient = bmd.context.createRadialGradient(25, 25, 0, 25, 25, 25);
	gradient.addColorStop(0, '#8ED6FF');
	gradient.addColorStop(1, '#004CB3');

	bmd.circle(25, 25, 25, gradient);

	ball = game.add.sprite(game.rnd.integerInRange(0, 750), 30, bmd);
	maxHeight = 0;

	// Enable the physics engine for the ball
	// and set some parameters.
	//
	game.physics.p2.enable(ball);
	ball.body.fixedRotation = true;
	ball.body.velocity.x = game.rnd.integerInRange(-100, 100);
}

function createCannon() {

	var bmd;
	var gradient;

	bmd = game.make.bitmapData(100, 25);
	gradient = bmd.context.createLinearGradient(0, 0, 80, 0);
	gradient.addColorStop(0, '#440000');
	gradient.addColorStop(1, '#FF0000');
	bmd.rect(0, 0, 100, 25, gradient);

	cannon = game.add.sprite(800, 600, bmd);
	game.physics.p2.enable(cannon);
	cannon.body.collideWorldBounds = true;
	cannon.body.static = true;
	cannon.pivot = new Phaser.Point(90, 0);

	bmd = game.make.bitmapData(100, 100);
	gradient = bmd.context.createRadialGradient(50, 50, 0, 50, 50, 50);
	gradient.addColorStop(0, '#FF5555');
	gradient.addColorStop(1, '#CC0000');
	bmd.circle(50, 50, 50, gradient);

	base = game.add.sprite(800, 600, bmd);
	game.physics.p2.enable(base);
	base.body.collideWorldBounds = false;
	base.body.static = true;

	//game.physics.p2.createRevoluteConstraint(cannon, [90, 0], base, [0, 0]);
}

function createBullet() {

	if (bullet) {
		return;
	}

	var bmd = game.make.bitmapData(10, 10);
	
	var gradient = bmd.context.createRadialGradient(5, 5, 0, 5, 5, 5);
	gradient.addColorStop(0, '#8ED6FF');
	gradient.addColorStop(1, '#004CB3');

	bmd.circle(5, 5, 5, gradient);

	// Calculate initial position.
	//
	var x = Math.cos(cannon.body.rotation) * 140;
	var y = Math.sin(cannon.body.rotation) * 140;
	bullet = game.add.sprite(800 - x, 600 - y, bmd);

	game.physics.p2.enable(bullet);
	bullet.checkWorldBounds = true;
	bullet.events.onOutOfBounds.add(function () {
		bullet.kill();
	}, this);
	bullet.body.onBeginContact.add(bulletContact, this);

	// Calculate initial speed.
	//
	var vx = Math.cos(cannon.body.rotation) * 500;
	var vy = Math.sin(cannon.body.rotation) * 500;
	bullet.body.velocity.x = -vx;
	bullet.body.velocity.y = -vy;
}

function bulletContact(body, shapeA, shapeB, equation) {

	if (!body || body === base.body || body === cannon.body) {
		bullet.kill();
		missed += 1;

		updateHUD();
	}

	else if (body === ball.body) {

		hit += 1;
		bullet.kill();
		ball.kill();

		var bmd = game.make.bitmapData(10, 10);
		var gradient = bmd.context.createRadialGradient(5, 5, 0, 5, 5, 5);
		gradient.addColorStop(0, '#FF0000');
		gradient.addColorStop(1, '#990000');
		bmd.circle(5, 5, 5, gradient);

		var emitter = game.add.emitter(ball.x, ball.y, 100);
		emitter.makeParticles(bmd);
		emitter.start(false, 1000, 20, 100);

		updateHUD();
	}
}

function pad(str) {
	var pad = "0000";
	return pad.substring(0, pad.length - str.length) + str;
}

function update() {

	if(ball) {
		var energy = Math.sqrt(ball.body.velocity.x * ball.body.velocity.x + ball.body.velocity.y * ball.body.velocity.y) + (600 - ball.y);
		if (energy < 100) {
			ball.kill();
		}
		
		if(!ball.alive) {
			ball.destroy();
			ball = null;
			createBall();
		}
	}

	if (cursors.left.isDown) {
		cannon.body.rotateLeft(80);
	}
	else if (cursors.right.isDown) {
		cannon.body.rotateRight(80);
	}

	if (game.input.mousePointer.isDown) {
		createBullet();
	}

	if (bullet && !bullet.alive) {
		bullet.destroy();
		bullet = null;
	}
}

function render() {
}
