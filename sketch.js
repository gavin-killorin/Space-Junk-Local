
let magpie;
let mothership;
let junk = [];

let keys = {};
let score = 0;
let delivered = 0;
let junkCount = 8;
let catchTime = 500;
let dropoffTime = 1000;

function setup() {
  createCanvas(800, 500);

  magpie = new Magpie(width / 2, height / 2);
  mothership = new Mothership(120, 100);

  for (let i = 0; i < junkCount; i++) {
    junk.push(new Junk(random(width), random(height)));
  }
}

function draw() {
  background(5, 8, 22);

  let delta = min(deltaTime, 50);
  let time = delta / 1000;

  handleControls(time);

  magpie.move(time);
  mothership.move(time);

  // Move junk that has not been captured
  for (let i = 0; i < junk.length; i++) {
    junk[i].move(time);
  }

  // Check tractor beam
  if (magpie.carrying === null) {
    let best = -1;

    for (let i = 0; i < junk.length; i++) {
      if (magpie.beamContains(junk[i])) {
        junk[i].beamTime += delta;
      } else {
        junk[i].beamTime -= delta;

        if (junk[i].beamTime < 0) {
          junk[i].beamTime = 0;
        }
      }

      if (junk[i].beamTime > catchTime) {
        if (best === -1 || junk[i].beamTime > junk[best].beamTime) {
          best = i;
        }
      }
    }

    if (best !== -1) {
      magpie.carrying = junk[best];
      junk.splice(best, 1);
      magpie.beam = false;
    }
  }

  // Keep captured junk behind Magpie 
if (magpie.carrying !== null) {
  let cargo = magpie.carrying;

  cargo.x = magpie.x - sin(magpie.rotation) * 55;
  cargo.y = magpie.y + cos(magpie.rotation) * 55;

  // Check distance from junk to Mothership
  let distance = dist(
    cargo.x, cargo.y,
    mothership.x, mothership.y
  );

  // Increase timer when inside pickup circle
  if (distance < mothership.pickupRadius) {
    cargo.dropoffTime += delta;
  } else {
    // Slowly decrease timer when outside
    cargo.dropoffTime = max(0, cargo.dropoffTime - delta);
  }

  // Deliver junk after staying inside for 1 second
  if (cargo.dropoffTime > dropoffTime) {
    magpie.carrying = null;
    delivered++;
    score += 100;
  }
}

  // Draw Mothership
  mothership.draw();

  // Draw junk
  for (let i = 0; i < junk.length; i++) {
    junk[i].draw();
  }

  // Draw captured junk
  if (magpie.carrying !== null) {
    magpie.carrying.draw();
  }

  // Draw player
  magpie.draw();

  // Game information
  noStroke();
  fill(255);
  textAlign(LEFT);
  textSize(18);

  text("Score: " + score, 15, 30);
  text("Delivered: " + delivered + "/" + junkCount, 15, 55);

  textSize(13);
  text("WASD = Move    SPACE = Tractor Beam", 15, height - 15);

  if (magpie.carrying !== null) {
    fill("#70eef5");
    textSize(16);
    text("Junk captured! Return to Mothership!", 15, 85);
  }

  if (delivered === junkCount) {
    textAlign(CENTER, CENTER);
    fill("#70eef5");
    textSize(40);
    text("All clear!", width / 2, height / 2 - 80);
  }
}

// Keyboard controls
function handleControls(time) {
  if (keys[87] || keyIsDown(87)) {
    magpie.thrust(180, time);
  }

  if (keys[83] || keyIsDown(83)) {
    magpie.thrust(-100, time);
  }

  if (keys[65] || keyIsDown(65)) {
    magpie.rotation -= 3 * time;
  }

  if (keys[68] || keyIsDown(68)) {
    magpie.rotation += 3 * time;
  }

  magpie.beam = (keys[32] || keyIsDown(32)) && magpie.carrying === null;
}

function keyPressed() {
  keys[keyCode] = true;

  if (keyCode === 32) {
    return false;
  }
}

function keyReleased() {
  keys[keyCode] = false;
}

// Wrap objects around the canvas
function wrap(obj) {
  if (obj.x < 0) obj.x += width;
  if (obj.x >= width) obj.x -= width;
  if (obj.y < 0) obj.y += height;
  if (obj.y >= height) obj.y -= height;
}

// Magpie spaceship
class Magpie {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.rotation = 0;
    this.beam = false;
    this.carrying = null;
  }

  thrust(accel, time) {
    this.dx += sin(this.rotation) * accel * time;
    this.dy -= cos(this.rotation) * accel * time;
  }

  move(time) {
    this.x += this.dx * time;
    this.y += this.dy * time;
    wrap(this);
  }

  beamContains(obj) {
    if (!this.beam) {
      return false;
    }

    let x = obj.x - this.x;
    let y = obj.y - this.y;

    let localX = x * cos(this.rotation) + y * sin(this.rotation);
    let localY = -x * sin(this.rotation) + y * cos(this.rotation);

    let beamWidth = 90;
    let beamHeight = 150;

    if (localY < 0 || localY > beamHeight) {
      return false;
    }

    let allowedWidth = localY / beamHeight * (beamWidth / 2);

    return abs(localX) <= allowedWidth;
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    rectMode(CENTER);
    noStroke();

    // Tractor beam
    if (this.beam) {
      fill(245, 243, 112, 65);
      triangle(0, 0, -45, 150, 45, 150);
    }

    // Main body
    fill("#525d80");
    rect(0, 0, 42, 60, 10);

    // Platform
    fill("#959ebb");
    rect(0, 31, 55, 5);

    // Window
    fill("#70eef5");
    stroke(0);
    strokeWeight(2);
    rect(16, -8, 15, 18, 4);

    pop();
  }
}

// Mothership
class Mothership {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 12;
    this.dy = 5;
    this.rotation = 0;
    this.pickupRadius = 85;
  }

  move(time) {
    this.x += this.dx * time;
    this.y += this.dy * time;
    wrap(this);
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    rectMode(CENTER);

    // Pickup hitbox
    noFill();
    stroke("#70eef5");
    strokeWeight(1);
    circle(0, 0, this.pickupRadius * 2);

    noStroke();

    // Body
    fill("#741160");
    rect(0, 0, 140, 55, 15);

    // Windows
    fill("#70eef5");

    for (let i = 1; i <= 4; i++) {
      let x = -70 + i * 28;
      circle(x, 0, 16);
    }

    pop();
  }
}

// Space junk
class Junk {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dx = random(-15, 15);
    this.dy = random(-15, 15);
    this.beamTime = 0;
    this.dropoffTime = 0;
  }

  move(time) {
    this.x += this.dx * time;
    this.y += this.dy * time;
    wrap(this);
  }

  draw() {
    push();
    translate(this.x, this.y);
    noStroke();
    fill("#a0936a");
    circle(0, 0, 20);
    pop();
  }
}
