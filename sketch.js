let shaderOne;
let cam;
let pastFrame;
let pass1;

//CLICK while looking at the cursor to launch sketch and begin training! 

var rawPosX;
var rawPosY;
var smoothedPosX_v1 = 0;
var smoothedPosX_v2 = 0;
var smoothedPosY_v1 = 0;
var smoothedPosY_v2 = 0;

function preload() {
  // load the shaders, we will use the same vertex shader and frag shaders for both passes
  shaderOne = loadShader('base.vert', 'frag1.frag');

  //load webgazer
  webgazer.showPredictionPoints(false).setGazeListener(function (data, elapsedTime) {
    if (data == null) {
      return;
    }
    rawPosX = data.x; //these x coordinates are relative to the viewport
    rawPosY = data.y; //these y coordinates are relative to the viewport
    smoothedPosX_v1 = lerp(rawPosX, smoothedPosX_v1, 0.9)
    smoothedPosY_v1 = lerp(rawPosY, smoothedPosY_v1, 0.9)

    smoothedPosX_v2 = lerp(smoothedPosX_v1, smoothedPosX_v2, 0.9)
    smoothedPosY_v2 = lerp(smoothedPosY_v1, smoothedPosY_v2, 0.9)
    console.log(elapsedTime); //elapsed time is based on time since begin was called
  }).begin();
}

function setup() {
  // shaders require WEBGL mode to work
  // at present time, there is no WEBGL mode image() function so we will make our createGraphics() in WEBGL, but the canvas renderer will be P2D (the default)
  pixelDensity(1); //important!!!
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // the pastFrame layer doesn't need to be WEBGL
  pastFrame = createGraphics(windowWidth, windowHeight);

  // initialize the webcam at the window size
  cam = createCapture(VIDEO);
  cam.size(windowWidth, windowHeight);
  // hide the html element that createCapture adds to the screen
  cam.hide();

  // initialize the createGraphics layers
  pass1 = createGraphics(windowWidth, windowHeight, WEBGL);

  // turn off the cg layers stroke
  pass1.noStroke();
}

function draw() {

  // set the shader for our first pass
  pass1.shader(shaderOne);
  shaderOne.setUniform('u_tex0', cam);
  shaderOne.setUniform('u_tex1', pastFrame);
  shaderOne.setUniform('u_resolution', [width, height]);
  shaderOne.setUniform('u_mouse', [smoothedPosX_v2, smoothedPosY_v2]);
  shaderOne.setUniform('u_time', millis() / 1000.0);
  // we need to make sure that we draw the rect inside of pass1
  pass1.rect(0, 0, width, height);

  // draw the pass to the screen
  image(pass1, 0, 0, width, height);

  // draw the cam into the createGraphics layer at the very end of the draw loop
  // because this happens at the end, if we use it earlier in the loop it will still be referencing an older frame
  pastFrame.image(cam, 0, 0, windowWidth, windowHeight);
  fill(255, 100)
  ellipse(smoothedPosX_v2, smoothedPosY_v2, 20, 20);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
