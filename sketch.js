// draw the grid -- each column is an array of notes, each on or off
// step[] is an array of the columns of notes - each array is the notes playing at that step
var timeSlots = [];
var cellWidth = 15;
var cellHeight = 15;
var numRows = 24;  // number of notes in scale
var numCols = 64;  // number of timeslots in sequence
var gridX = 50, gridY = 100;  // upper lefthand corner of sequence grid
var playButton, stopButton, pauseButton;
var tempoSlider;
var currTimeSlot = -1;
var osc = [];
var width, height;

function setup() {
  width = cellWidth*numCols + 2*gridX;
  height = cellHeight*numRows + 2*gridY;
  createCanvas(width, height);

  background(240);
  for (var col = 0; col < numCols; col++) { // x pos
    var notes = [];
    for (var row = 0; row < numRows; row++) {  // ypos
      notes[row] = false;
    }
    timeSlots[col] = notes;
  }
  
  for (var row = 0; row < numRows; row++) {  // ypos
      osc[row] = new p5.Oscillator('Sawtooth');
      osc[row].amp(0);
      osc[row].freq(midiToFreq(60 + numRows - row));
      osc[row].start();
  }
  playButton = createButton("Play");
  playButton.position(50, 30);
  playButton.mousePressed(playClicked);
  pauseButton = createButton("Pause");
  pauseButton.position(100, 30);
  pauseButton.mousePressed(pauseClicked);
  stopButton = createButton("Stop");
  stopButton.position(150, 30);
  stopButton.mousePressed(stopClicked);
  tempoSlider = createSlider(100, 400, 250);
  tempoSlider.position(50, 60);
}

var mouseWasPressed = false;
var mouseWasPressedRow, mouseWasPressedCol;

function draw() {
  background(240);
  
  var mouseCellCol = int((mouseX - gridX)/cellWidth);
  var mouseCellRow = int((mouseY - gridY)/cellHeight);
  var noteArray;
  
  if (mouseIsPressed) {
    println("mouseIsPressed");
    if (mouseWasPressed === false) {
      // just now pressed
      mouseWasPressed = true;
      mouseWasPressedRow = mouseCellRow;
      mouseWasPressedCol = mouseCellCol;
    }
  } else {
    if (mouseWasPressed === true) {
      // just now released
      mouseWasPressed = false;
      if (mouseWasPressedRow === mouseCellRow) {
        /*
        if (mouseWasPressedCol === mouseCellCol) {
            // clicked in the same column -- just one cell
            noteArray = timeSlots[mouseCellCol];
            noteArray[mouseCellRow] = !noteArray[mouseCellRow];
         } else {
         */
            // same row but different column
            if (mouseWasPressedCol < mouseCellCol) {
              var temp = mouseWasPressedCol;
              mouseWasPressedCol = mouseCellCol;
              mouseCellCol = temp;
            }
            for (var col = mouseCellCol; col <= mouseWasPressedCol; col++) {
              noteArray = timeSlots[col];
              noteArray[mouseCellRow] = !noteArray[mouseCellRow];
            }
           
        // }
      }
    }
  }
  
  for (var col = 0; col < numCols; col++) { // y pos
    noteArray = timeSlots[col];
    for (var row = 0; row < numRows; row++) {  // xpos
      if (row == mouseCellRow && col == mouseCellCol) {
        fill(0, 255, 255);
      } else if (noteArray[row]) {
        fill(255, 0, 255);
      } else {
        if (col === currTimeSlot) {
          fill(200);
        } else {
          noFill();
        }
      }
      var x = col * cellWidth + gridX;
      var y = row * cellHeight + gridY;
      
      rect(x, y, cellWidth, cellHeight);
    }  
  }
}

var timeout;
var playing;
function playClicked()
{
  if (!playing) {
    timeout = setInterval(goToNextTimeSlot, tempoSlider.value());
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
  clearInterval(timeout);
  playing = false;
  currTimeSlot = -1;
  stopAllNotes();
}

function stopAllNotes()
{
   for (var nxtNote = 0; nxtNote < numRows; nxtNote++) {
      osc[nxtNote].fade(0, 0.1);
   }
}

function goToNextTimeSlot()
{
  var lastTimeSlot = currTimeSlot;
  currTimeSlot++;
  if (currTimeSlot >= numCols) {
    currTimeSlot = 0;
  }
  var noteArray = timeSlots[currTimeSlot]
  for (var nxtNote = 0; nxtNote < numRows; nxtNote++) {
    if (noteArray[nxtNote]) {
      osc[nxtNote].fade(0.5, 0.1);
    } else {
      osc[nxtNote].fade(0, 0.1);
    }
    
  }
}