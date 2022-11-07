var ndarray = require('ndarray')
var graphpipe = require('graphpipe')
var axios = require('axios')

var gGameField = new Array();
var gDiscs;
var gBoard = document.getElementById("game-table");
var gCurrentPlayer;
var gId = 1;
var gModels = new Array();
var gPredReady = new Array();
var gPriors;

// Whether computer plays red/yellow.
var gCompPlays = [false, false];
var gDisableUI = false;
var gGameId = 0;

function newGame(loadFromUrl) {
  gGameId += 1
  gBoard.innerHTML = "";
  gDiscs = new Array();
  gPredReady = [false, false];
  prepareField();
  gCurrentPlayer = 1;
  if (loadFromUrl == true) {
    loadFromQueryString();
  }
  updatePredictions();
  addNewDisc(0);
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Turns a query param like "3,4;1,2" into an array like [[3, 4], [1, 2]]
function posStrToArray(posStr) {
  var rowColStrs = posStr.split(';')
  var rowCols = [];
 
  rowColStrs.forEach(function(s) {
    rc = s.split(',');
    rowCols.push([parseInt(rc[0]), parseInt(rc[1])]);
  });
  
  return rowCols;
}

function loadFromQueryString() {
  var autoplay1Str = getParameterByName('autoplay1');
  if (autoplay1Str) {
    $("#AutoPlay1").prop("checked", autoplay1Str == "true");
    gCompPlays[0] = autoplay1Str=="true";
  }

  var autoplay2Str = getParameterByName('autoplay2');
  if (autoplay2Str) {
    $("#AutoPlay2").prop("checked", autoplay2Str == "true");
    gCompPlays[1] = autoplay2Str=="true";
  }
  
  var discStr = getParameterByName('discs');
  if (discStr) {
    var pos = posStrToArray(discStr);
    for (i = 0; i < pos.length; i++) {
      disc = addNewDisc(0);
      placeDisc(disc, pos[i][0], pos[i][1]);
      changePlayer();
    }
  }

  var model1Str = getParameterByName('model1');
  if (model1Str) {
    $("#ModelSelect1").val(model1Str)
    gModels[0] = document.getElementById("ModelSelect1").value
  }

  var model2Str = getParameterByName('model2');
  if (model2Str) {
    $("#ModelSelect2").val(model2Str)
    gModels[1] = document.getElementById("ModelSelect2").value
  }

  var skill1Str = getParameterByName('skill1');
  if (skill1Str) {
    $("#Skill1").val(skill1Str)
  }

  var skill2Str = getParameterByName('skill2');
  if (skill2Str) {
    $("#Skill2").val(skill2Str)
  }

}

function getUrl() {
  var urlBase = getUrlBase();
  var urlBaseQ = urlBase + "?";

  var model1Param = "model1=" + $("#ModelSelect1").val();
  var model2Param = "&model2=" + $("#ModelSelect2").val();

  var skill1Param = "&skill1=" + $("#Skill1").val();
  var skill2Param = "&skill2=" + $("#Skill2").val();

  var autoPlay1Param = "&autoplay1=" + $("#AutoPlay1").prop('checked')
  var autoPlay2Param = "&autoplay2=" + $("#AutoPlay2").prop('checked')

  var url = urlBaseQ + model1Param + model2Param + skill1Param + skill2Param + autoPlay1Param + autoPlay2Param;

  if (gDiscs.length == 1) {
    return url
  }

  // If there's a hovering disc, don't include it.
  var lastIdx = gDiscs[gDiscs.length-1].dropped ? gDiscs.length-1 : gDiscs.length-2;
  var pos = [];
  for (i = 0; i <= lastIdx; i++) {
    pos.push(gDiscs[i].row + ',' + gDiscs[i].col);
  }

  var discsParam = "&discs=" + pos.join(';')
  url = url + discsParam;
  return url
}

function copyGameToClipboard(event) {
  var urlBase = getUrlBase();
  var urlBaseQ = urlBase + "?";

  var model1Param = "model1=" + $("#ModelSelect1").val();
  var model2Param = "&model2=" + $("#ModelSelect2").val();

  var skill1Param = "&skill1=" + $("#Skill1").val();
  var skill2Param = "&skill2=" + $("#Skill2").val();

  var autoPlay1Param = "&autoplay1=" + $("#AutoPlay1").prop('checked')
  var autoPlay2Param = "&autoplay2=" + $("#AutoPlay2").prop('checked')

  var url = urlBaseQ + model1Param + model2Param + skill1Param + skill2Param + autoPlay1Param + autoPlay2Param;

  if (gDiscs.length == 1) {
    copyToClipboard(url);
    return;
  }

  // If there's a hovering disc, don't include it.
  var lastIdx = gDiscs[gDiscs.length-1].dropped ? gDiscs.length-1 : gDiscs.length-2;
  var pos = [];
  for (i = 0; i <= lastIdx; i++) {
    pos.push(gDiscs[i].row + ',' + gDiscs[i].col);
  }
 
  var discsParam = "&discs=" + pos.join(';')
  url = url + discsParam;
  copyToClipboard(url);
  event.preventDefault();
}

function getUrlBase() {
  return window.location.href.split('?')[0];
}

window.Clipboard = (function(window, document, navigator) {
    var textArea,
        copy;

    function isOS() {
        return navigator.userAgent.match(/ipad|iphone/i);
    }

    function createTextArea(text) {
        textArea = document.createElement('textArea');
        textArea.value = text;
        document.body.appendChild(textArea);
    }

    function selectText() {
        var range,
            selection;

        if (isOS()) {
            range = document.createRange();
            range.selectNodeContents(textArea);
            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            textArea.setSelectionRange(0, 999999);
        } else {
            textArea.select();
        }
    }

    function copyToClipboard() {        
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    copy = function(text) {
        createTextArea(text);
        selectText();
        copyToClipboard();
    };

    return {
        copy: copy
    };
})(window, document, navigator);

function copyToClipboard(str) {
  Clipboard.copy(str);
  $('#clipboard-modal').modal('show');
  window.scrollTo(0, 0);
}

function loadNewModel(player) {
  document.getElementById("result").textContent = "Loading model...";
  gModels[player - 1] = document.getElementById("ModelSelect" + player).value
  updatePredictions();
}

var gSource;

function loadRemote(model, b, token) {
    var id = gGameId
    var arr = new Float32Array(2 * 6 * 7)
    for (var i=0; i<2*6*7; i++) {
      arr[i] = b[i]
    }
    var nda = ndarray(arr, [1, 2, 6, 7])

    var req = graphpipe.remote("/api/" + model + "/", nda, "", "", "", {cancelToken: token})
    return req
}

function autoPlay(player) {
  gCompPlays[player - 1] = document.getElementById("AutoPlay" + player).checked;
}

function computerToPlay() {
  return gCompPlays[gCurrentPlayer-1];
}


function now() {
  var d = new Date()
  var n = d.getTime()
  return n
}

var gLastPlay = now()

function loop() {
  if (now() - gLastPlay < 1500) {
    return
  }
  if (computerToPlay()) {
    if (gPredReady[gCurrentPlayer]) {
      var disc = gDiscs[gDiscs.length - 1];
      playBestMove(disc);
      gLastPlay = now();
    }
  }
}


setInterval(loop, 500);

/*
function computerMaybePlay() {
  if (computerToPlay()) {
    disc = gDiscs[gDiscs.length - 1];
    if (gPredReady[gCurrentPlayer]) {
      setTimeout(function() {
        playBestMove(disc);
      }, 1250);
    } else {
      var player = gCurrentPlayer;
      document.addEventListener("predReady", function(e) {
        if (e.detail.player == player) {
          playBestMove(disc);
        }
      }, {once: true});
    }
  }
}
*/

function applyT(T, priors) {
  T = Math.floor(T);
  if (T == 1) {
    T = 1;
  } else if (T == 2) {
    T = 0.8;
  } else if (T == 3) {
    T = 0.66;
  } else if (T == 4) {
    T = 0.5;
  } else if (T == 5) {
    T = 0.25;
  } else if (T == 6) {
    T = 0.1;
  } else if (T == 7) {
    T = 0.01;
  }
  var adjustedPriors = [];
  var adjustedTotal = 0;
  for (var i = 0; i < 7; i++) {
    adjustedPriors[i] = priors[i] ** (1/T);
    adjustedTotal += adjustedPriors[i];
  }
  for (var i = 0; i < 7; i++) {
    adjustedPriors[i] /= adjustedTotal;
  }
  return adjustedPriors;
}

function argmax(array) {
  var max = -1;
  var maxIdx = 0;
  for (i = 0; i < array.length; i++) {
    if (possibleColumns().indexOf(i) != -1) {
      if (array[i] > max) {
        max = array[i];
        maxIdx = i;
      }
    }
  }
  return maxIdx;
}

function weightedChoice(array) {
  array = array.slice();
  var total = 0.0;
  for (var i = 0; i < array.length; i++) {
    if (possibleColumns().indexOf(i) == -1) {
      array[i] = 0;
    }
    total += array[i]; 
  }
  for (var i = 0; i < array.length; i++) {
    array[i] /= total; 
  }
  var r = Math.random();
  var cur = 0.0;
  for (var i = 0; i < array.length; i++) {
    cur += array[i];
    if (r <= cur) {
      return i;
    }
  }
  alert('oh no');
}

function playBestMove(disc) {
  var T = 1;
  if (disc.player==1) {
    T = document.getElementById('Skill1').value;
  } else {
    T = document.getElementById('Skill2').value;
  }

  var adjustedPriors = applyT(T, gPriors);
  var col = weightedChoice(adjustedPriors);
  dropDisc(disc, col);
}

var gShouldUpdatePredictions = false
function updatePredictions() {
  gShouldUpdatePredictions = true
}

function updatePredictions() {
  var model = gModels[gCurrentPlayer - 1];
  if (model == null) {
    return;
  }

  var b = [
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,

    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ]
  var x = document.getElementsByClassName("disc");
  var p = gCurrentPlayer - 1;
  var current = p == 0 ? 1 : 2;
  var other = p == 0 ? 2 : 1;
  for (var r = 0; r < gGameField.length; r++) {
    for (var c = 0; c < gGameField[0].length; c++) {
      if (gGameField[r][c] == current) {
        b[r * 7 + c] = 1;
      } else if (gGameField[r][c] == other) {
        b[r * 7 + c + 42] = 1;
      }
    };
  };

  document.getElementById("result").innerHTML = "Loading...";
  for (var i = 0; i < 7; i++) {
    document.getElementById('s' + i).textContent = ""
  }
  gDisableUI = true;
  if (gSource) {
    gSource.cancel()
    gSource = null
  }
  var CancelToken = axios.CancelToken;
  gSource = CancelToken.source();
  loadRemote(model, b, gSource.token).then(function (response) {
    gSource = null
    var rslt = response.data;
    gPriors = rslt[0].data
    value = rslt[1].data[0]
    gDisableUI = false;

    var T = 1;
    if (p==0) {
      T = document.getElementById('Skill1').value;
    } else {
      T = document.getElementById('Skill2').value;
    }

    var adjustedPriors = applyT(T, gPriors);
    for (var i = 0; i < 7; i++) {
      document.getElementById('s' + i).textContent = Math.round(adjustedPriors[i] * 100) + "%";
    }
    percentage = Math.floor(Math.abs(value) * 100) + "%";
    var message = "looks like a draw";
    var pcolor = "red"
    if (p == 1) {
      pcolor = "yellow";
    }
    if (value < -0.05 || value > 0.05) {
      color = "red";
      if ((p == 0 && value < -0.05) || (p == 1 && value > 0.05)) {
        color = "yellow";
      }
      message = "I am " + percentage + " confident " + color + " will win"
    }

    if (p == 0) {
      message = "Red <small>(" + $('#ModelSelect1 option:selected').text() + ")</small> thinks:<br/> " + message;
    } else {
      message = "Yellow <small>(" + $('#ModelSelect2 option:selected').text() + ")</small> thinks:<br/> " + message;
    }

    document.getElementById("result").innerHTML = message;
    gPredReady[p+1] = true;
    /*
    document.dispatchEvent(new CustomEvent("predReady", {
      detail: {
        player: p+1
      }}));
    */
  }).catch(function (error) {
    if (error.toString() == "Cancel") {
      return;
    }
    $('#retry-modal').modal('show');
  });

}

window.onload = function() {
  gCompPlays[0] = $("#AutoPlay1").prop('checked');
  gCompPlays[1] = $("#AutoPlay2").prop('checked');

  gModels[0] = document.getElementById("ModelSelect1").value
  gModels[1] = document.getElementById("ModelSelect2").value

  newGame(true);

  $('#message-modal').on('hidden.bs.modal', function (e) {
    newGame();
  })
  $('#message-modal').on('shown.bs.modal', function (e) {
    window.setTimeout(function() {
      if (getParameterByName("autoclose")) {
        $('#message-modal').modal('hide');
      }
    }, 500)
  })
  $('#retry-modal').on('hidden.bs.modal', function (e) {
    updatePredictions()
  })
  $('#retry-modal').on('shown.bs.modal', function (e) {
  })
};

function checkForTie() {
  return possibleColumns().length == 0;
}

function checkForVictory(row, col) {
  if ((getAdj(row, col, 0, 1) + getAdj(row, col, 0, -1) > 2) ||
      (getAdj(row, col, 1, 0) > 2) ||
      (getAdj(row, col, -1, 1) + getAdj(row, col, 1, -1) > 2) ||
      (getAdj(row, col, 1, 1) + getAdj(row, col, -1, -1) > 2)) {
    return true;
  }
}

function getAdj(row, col, row_inc, col_inc) {
  if (cellVal(row, col) == cellVal(row + row_inc, col + col_inc)) {
    return 1 + getAdj(row + row_inc, col + col_inc, row_inc, col_inc);
  } else {
    return 0;
  }
}

function cellVal(row, col) {
  if (gGameField[row] == undefined || gGameField[row][col] == undefined) {
    return -1;
  } else {
    return gGameField[row][col];
  }
}

function firstFreeRow(col) {
  var i;
  for (i = 0; i < 6; i++) {
    if (gGameField[i][col] != 0) {
      break;
    }
  }
  return i - 1;
}

function possibleColumns() {
  var moves_array = new Array();
  for (var i = 0; i < 7; i++) {
    if (gGameField[0][i] == 0) {
      moves_array.push(i);
    }
  }
  return moves_array;
}

var isSafari = !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);

var hSize = 91.4;
var vSize = 77.75;
var hOff = 10.75;
var vOff = 7;

if (isSafari) {
    vOff = 8.25;
    vSize = 77.8;
}

var maxScale = 0.75;
var scale = 0.75;

function doResize() {
  var w = $(window).width();
  if (w < 768) {
    scale = (w/692);
  } else {
    scale = maxScale;
  }
  $("#game-outer").attr("style", "transform: scale(" + scale + "); transform-origin: 0 0;");
  $("#leftcol").attr("style", "height: " + 600 * scale + "px; padding-top:" + 30 * (scale**3) + "px;");
}

$("#ModelSelect1").change(function() { loadNewModel(1); });
$("#ModelSelect2").change(function() { loadNewModel(2); });
$("#AutoPlay1").change(function() { autoPlay(1) });
$("#AutoPlay2").change(function() { autoPlay(2) });
$("#newGame").click(function() { newGame() });
$("#undo").click(function() { undo() });
$("#copyGameToClipboard1").click(function(event) { copyGameToClipboard(event) });
$("#copyGameToClipboard2").click(function(event) { copyGameToClipboard(event) });
$("#HideHints").change(function(event) {
    if ($("#HideHints").prop('checked')) {
      $("#scores").hide()
    } else {
      $("#scores").show()
    }
});

window.addEventListener("resize", function() {
  window.setTimeout(doResize, 100);
});

doResize()

function Disc(player, col) {
  this.player = player;
  this.color = player == 1 ? 'red' : 'yellow';
  this.id = 'd' + gId.toString();
  this.row = 0;
  this.col = col;
  this.dropped = false;
  gId++;

  this.addToScene = function() {
    var disc = document.createElement("div");
    disc.id = this.id
    disc.className = "disc " + this.color;
    gBoard.appendChild(disc)
    document.getElementById($this.id).style.left = (hOff + hSize * this.col) + "px";
    document.getElementById($this.id).style.top = "-75px";
  }

  var $this = this;
  
  this.moveToColumn = function(col) {
    $this.col = col;
    document.getElementById($this.id).style.left = (hOff + hSize * col) + "px";
    document.getElementById($this.id).style.top = "-75px";
  }
  
  document.onmousemove = function(evt) {
    col = getCol(evt.clientX);
    if (col < 0) {
      col = 0;
    }
    if (col > 6) {
      col = 6;
    }
    $this.moveToColumn(col);
  }
  
  document.onload = function(evt) {
    document.onmousemove();
  }

  var lastClick = 0;
  document.getElementById("board").onclick = function(evt) {
    if (gDisableUI) {
      return;
    }
    var now = new Date().getTime();
    if (now - lastClick < 1000) {
      return;
    }
    lastClick = now;
    if (gCompPlays[$this.player - 1]) {
      return;
    }

    row = getRow(evt.clientY);
    col = getCol(evt.clientX);
    if (row >= 0 && row < 6 && possibleColumns().indexOf(col) != -1) {
      dropDisc($this, col);
    }
  }
}

function getRow(y) {
  y = y - $('#game-table').offset().top + vSize;
  return Math.floor(y/vSize);
}

function getCol(x) {
  x = x - $('#game-table').offset().left;
  x = x/scale;
  return Math.floor(x/(hSize+1));
}

// Used only when loading an existing game.
function placeDisc(disc, row, col) {
  disc.dropped = true;
  disc.moveToColumn(col);
  disc.row = row;
  gGameField[row][disc.col] = disc.player;

  var element = document.getElementById(disc.id);
  element.style.top = (vOff + row * vSize) + 'px';
}

function dropDisc(disc, col) {
  if (disc.dropped) {
    return;
  }
//  $("#add2any").data("a2a-url", getUrl())
  disc.dropped = true;
  disc.moveToColumn(col);
  var row = firstFreeRow(disc.col);
  disc.row = row;
  gGameField[row][disc.col] = disc.player;
  gPredReady[gCurrentPlayer] = false;
  
  var element = animateDiscDrop(disc.id, (vOff + row * vSize));
  document.onmousemove = null;
  document.onclick = null;
  element.addEventListener("transitionend", function(e) {
  // transitionend fires twice (for horizontal and vertical motion) if
  // the disc hasn't caught up with the mouse's column.
  if (e.propertyName == 'top') {
    if (checkForVictory(disc.row, disc.col)) {
      var color = disc.player == 2 ? 'Yellow' : 'Red';
      $("#modal-title-text").html(color + " wins!");
      $('#message-modal').modal('show');
      window.scrollTo(0, 0);
    } else if (checkForTie()) {
      $("#modal-title-text").html("It's a tie!");
      $('#message-modal').modal('show');
      window.scrollTo(0, 0);
    } else {
      changePlayer();
      updatePredictions();
      addNewDisc(disc.col);
    }
  }
  });
}

function changePlayer() {
  gCurrentPlayer = 3 - gCurrentPlayer;
}

function addNewDisc(col) {
  var disc = new Disc(gCurrentPlayer, col);
  disc.addToScene();
  gDiscs.push(disc);
  //computerMaybePlay(); 
  return disc;
}

function prepareField() {
  gGameField = new Array();
  for (var i = 0; i < 6; i++) {
    gGameField[i] = new Array();
    for (var j = 0; j < 7; j++) {
      gGameField[i].push(0);
    }
  }
}

function animateDiscDrop(who, where) {
  var element = document.getElementById(who);
  // Run async to allow page to render. Otherwise it's possible that the disc
  // creation and position update happen in the same JS cycle, preventing the
  // transition from firing.
  setTimeout(function(element) {
    element.style.top = where + 'px';
  }, 0, element);
  
  /*
  if (isSafari) {
    var sound = new Audio('disc-drop-fast.m4a');
    sound.volume = 0.35;
    sound.play();
  } else {
    var sound = new Audio('disc-drop.m4a');
    sound.volume = 0.35;
    sound.play();
  }
  */
  return element;
}

function undo() {
  if (computerToPlay()) {
    return;
  }
  if (gDiscs.length == 2) {
    return;
  }

  var disc = gDiscs[gDiscs.length - 1];
  if (!disc.dropped) {
    var hoveringDisc = gDiscs.pop();
    gBoard.removeChild(document.getElementById(hoveringDisc.id));
  }

  if (gDiscs.length > 0) {
    var lastDisc = gDiscs.pop();
    gBoard.removeChild(document.getElementById(lastDisc.id));
    gGameField[lastDisc.row][lastDisc.col] = 0;
    changePlayer();
  }
 
  if (computerToPlay()) {
    var lastDisc = gDiscs.pop();
    gBoard.removeChild(document.getElementById(lastDisc.id));
    gGameField[lastDisc.row][lastDisc.col] = 0;
    changePlayer();
  }

  addNewDisc(0);
  updatePredictions();
}

document.getElementById('Skill2').oninput = function() {
  updatePredictions();
}

document.getElementById('Skill1').oninput = function() {
  updatePredictions();
}
