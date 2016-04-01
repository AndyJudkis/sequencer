// tap sequencer version 2
// create a row of tones from a grid, and make a rhythm using the space bar
// select the scale - dorian, locrian using a drop down
// to see it in action, look at https://www.youtube.com/watch?v=-kMAxUZnOxI
// there's so much more that can be done with this, I hope to get back to it someday

// buttons for recording the intervals of the melody
var mybutton = new ButtonStack(20, 20, 20, 10, 10);
var buttonStackRow = []; // array
var nxtInterval = 0;  // which tone is the next to play? index into buttonStackRow
var currInterval = 0;
var numStacks = 16; // how many button stacks in a row?
var buttonsInStack = 16;
var buttonWidth = 30;
var buttonHeight = 10;
var xOffset = 40;
var yOffset = 80;

// http://www.grantmuller.com/MidiReference/doc/midiReference/ScaleReference.html
scales = {
  "aeolian" : [0, 2, 3, 5, 7, 8, 10],
  "blues" : [0, 2, 3, 4, 5, 7, 9, 10, 11],
  "chromatic" : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  "diatonic_minor" : [0, 2, 3, 5, 7, 8, 10],
  "dorian" : [0, 2, 3, 5, 7, 9, 10],
  "harmonic_minor" : [0, 2, 3, 5, 7, 8, 11],
  "indian" : [0, 1, 1, 4, 5, 8, 10],
  "locrian" : [0, 1, 3, 5, 6, 8, 10],
  "lydian" : [0, 2, 4, 6, 7, 9, 10]
};
var currentScale = scales["aeolian"];
var scaleSelector;
var playButton, stopButton, pauseButton, clearButton;
var tempoSlider;

var playing;

var metronomeOsc;  // oscillator for metronome tick
var noteOsc;       // oscillator for musical note
var envelope;

var attackLevel = 1.0;
var releaseLevel = 0;
var attackTime = 0.001
var decayTime = 0.2;
var susPercent = 0.2;
var releaseTime = 0.5;

var timeSlots = [];
var cellWidth = 5;
var cellHeight = 8;
var numRows = 2;
var ticksPerQuarter = 24;
var ticksPerRow = 4 * ticksPerQuarter;  // number of timeslots in sequence
var gridX = 50, gridY = 200;  // upper lefthand corner of sequence grid
var beatClock = -1;

function setup() {
  createCanvas(900,600);
  
  addControls();
  setupSound();
  clearClicked(); // clear rhythm track
  
  for (var nxt = 0; nxt < numStacks; nxt++ ) {
    buttonStackRow.push(new ButtonStack(xOffset + (nxt * buttonWidth), yOffset, buttonWidth, buttonHeight, buttonsInStack, nxt));
  }
  //frameRate(0.3);
}

function draw() {
  background(0, 120, 180);
  // draw grid for notes
  for (var nxt = 0; nxt < buttonStackRow.length; nxt++) {
    buttonStackRow[nxt].drawAll();
  }
  
  // draw grid for rhythm
  for (var row = 0; row < numRows; row++) {
    for (var col= 0; col < ticksPerRow; col++) {
      if (timeSlots[col + (row * ticksPerRow)] == 0) {
        fill(220);
      } else {
        fill(0,0,255);
      }
      if (playing) {
        if (int(beatClock/ticksPerRow) == row && beatClock%ticksPerRow == col) {
          fill(255, 255, 255);
        }
      }
      rect(xOffset + (col * cellWidth), 50 + (row * 10), cellWidth, cellHeight);
      if (col % 24 == 0) {
        // quarter note beats are marked
        fill(0);
        rect(xOffset + (col * cellWidth), 60 + (row * 10), 5, 5);
      }
    }
  }
}

function mouseClicked() {
  for (var nxt = 0; nxt < buttonStackRow.length; nxt++) {
    buttonStackRow[nxt].checkClick();
  }
  
}

function addControls() {
  scaleSelector = createSelect();
  scaleSelector.position(xOffset, 25);
  for (var nxt in scales) {
    scaleSelector.option(nxt);
  }
  scaleSelector.changed(newScale);
  playButton = createButton("Play");
  playButton.position(xOffset + 150, 25);
  playButton.mousePressed(playClicked);
  pauseButton = createButton("Pause");
  pauseButton.position(xOffset + 200, 25);
  pauseButton.mousePressed(pauseClicked);
  stopButton = createButton("Stop");
  stopButton.position(xOffset + 250, 25);
  stopButton.mousePressed(stopClicked);

  tempoSlider = createSlider(10, 40, 25);
  tempoSlider.position(xOffset + 300, 25);
  
  clearButton = createButton("Clear");
  clearButton.position(xOffset + 450, 25);
  clearButton.mousePressed(clearClicked);
}

function setupSound() {
  envelope = new p5.Env();
  envelope.setADSR(attackTime, decayTime, susPercent, releaseTime);
  envelope.setRange(attackLevel, releaseLevel);
  
  metronomeOsc = new p5.Oscillator('Sawtooth');
  metronomeOsc.amp(0);
  metronomeOsc.freq(200);
  metronomeOsc.start();
  
  noteOsc = new p5.Oscillator('Sawtooth');
  noteOsc.amp(0);
  noteOsc.freq(60);
  noteOsc.start();
}

var timeout;
var playing;
function playClicked()
{
  if (!playing) {
    //timeout = setInterval(goToNextTimeSlot, tempoSlider.value());
    timeout = setTimeout(goToNextTimeSlot, tempoSlider.value());
    playing = true;
  }
}

function pauseClicked()
{
  clearInterval(timeout);
  playing = false;
  stopAllNotes();
}

function stopClicked()
{
  clearTimeout(timeout);
  playing = false;
  beatClock = -1;
  stopAllNotes();
}

function clearClicked()
{
  for (var col = 0; col < ticksPerRow * numRows; col++) { // x pos
    timeSlots[col] = 0;
  }
}

function stopAllNotes()
{
  metronomeOsc.amp(0, 0);
  noteOsc.amp(0, 0);
}

function newScale() 
{
  currentScale = scales[scaleSelector.selected()];
}

function goToNextTimeSlot()
{
  timeout = setTimeout(goToNextTimeSlot, tempoSlider.value());
  var prevBeatClock = timeSlots[beatClock];   // current tick -- 1 if it's already playing. . . 
  beatClock++;
  if (beatClock >= ticksPerRow * numRows) {
    beatClock = 0;
  }
  if (keyIsDown(CONTROL)) {
    if (keyIsDown(32)) { // space bar
      timeSlots[beatClock] = 1;
    } else {
      timeSlots[beatClock] = 0;
    }
  }
  if (beatClock % 24 == 0) {
    metronomeOsc.amp(0.5, 0);
  } else if (beatClock % 24 == 1) {
    metronomeOsc.amp(0, 0);
  }
  
  if (timeSlots[beatClock] == 1 && prevBeatClock == 0)  {
    // just went from off to on
    var nxtNote = buttonStackRow[nxtInterval].selected();
    currInterval = nxtInterval;
    /*if (nxtNote == "loop") {
      nxtInterval = 0;
      console.log("back to first note of row");
    }*/
    var step = int(buttonStackRow[nxtInterval].selected()); // step is an int between 0 and buttonsInStack -1
    var note = (12* int(step/currentScale.length)) + currentScale[ (step % currentScale.length)];
    console.log("step=" + step + " note=" + note);
    
    noteOsc.freq(midiToFreq(60 + note));
    noteOsc.amp(0.5, 0.05);
    nxtInterval++;
    if (nxtInterval >= buttonStackRow.length) {
      nxtInterval = 0;
    }
  } else if (timeSlots[beatClock] == 0 && prevBeatClock == 1) {
    // just went from on to off
    //console.log("note off");
    noteOsc.amp(0, 0.1);
  }
}


function ButtonStack(x, y, buttonWidth, buttonHeight, numButtons, col) {
  this.buttons = [];
  this.currentSelection = -1;
  this.col = col;
  
  for (var row = 0; row < numButtons; row++) {
    var newButton = new Button(x, y + (row*buttonHeight), buttonWidth, buttonHeight, row, col, this);
    this.buttons.push(newButton);
    //console.log("push button on array")
  }
  
  ButtonStack.prototype.drawAll = function() {
    //console.log("curr Sel=" + this.currentSelection + " in col=" + this.col);
    //console.log("draw: buttons has " + this.buttons.length + " items")
    for (var nxt = 0; nxt < this.buttons.length; nxt++) {
      this.buttons[nxt].draw();
    }
  }
  
  ButtonStack.prototype.checkClick = function() {
    for (var nxt = 0; nxt < this.buttons.length; nxt++) {
      if (this.buttons[nxt].mouseOver(mouseX, mouseY)) {
        this.currentSelection = nxt;
        break;
      }
    }
  }
  
  ButtonStack.prototype.selected = function() {
    return this.currentSelection;
  }
}

function Button(x, y, bWidth, bHeight, row, col, parentStack) {
  //console.log("make button at" + x + " " + y + ", wd=" + bWidth + ", ht=" + bHeight);
  this.x = x;
  this.y = y;
  this.row = row;
  this.col = col;
  this.bWidth = bWidth;
  this.bHeight = bHeight;
  this.parentStack = parentStack;
  
  Button.prototype.draw = function() {
    if (this.mouseOver(mouseX, mouseY)) {
      // control-click to make this the selected button for this row
      if (this.parentStack.currentSelection == this.row) {
        fill(0, 255, 0);
        
      } else {
        fill(89);
      }
    } else {
      // mouse not over 
      if (this.parentStack.currentSelection == this.row) {
        fill(0, 120, 0);
      } else if (this.col == currInterval && playing) {
        fill(255);
      } else {
        fill(220);
      }
    }
    rect(this.x, this.y, this.bWidth, this.bHeight);
  }
  
  Button.prototype.mouseOver = function(mX, mY) {
    //console.log("mX=" + mX + ", mY=" + mY + ", this.x=" + this.x + ", this.y=" + this.y);
    var retVal = (( mX > this.x && mX < this.x + this.bWidth) && (mY > this.y && mY < this.y + this.bHeight));
    //console.log("row=" + this.row + ", col=" + this.col + ", mouseOver=" + retVal);
    return retVal;
  }
}