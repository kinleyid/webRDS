
var decoded = decodeURIComponent(window.location.search);
var pID = decoded.substring(decoded.indexOf('=')+1);
var filename = pID + "RDS";

//Change these variables to customize the experiment
var noRptsWithin                = 4; // There cannot be repeated numbers within this number of stimuli
// I.e. if it is set to 4, the following sequence would not be generated: [1,2,3,1].
// But this sequence might be: [1,2,3,4,1].
var nBlanksBeforeCross          = 30; // Number of frames there's a blank before the fixation cross
var nCrossFrames                = 60; // Number of frames the fixation cross is displayed
var nBlanksAfterCross           = 30; // Number of frames there's a blank after the fixation cross
var nDgtFrames                  = 60; // Number of frames the digits are displayed
var nBlanksBetweenDigits        = 30; // Number of frames there's a blank between digits
var nBlanksAfterLastDigit       = 30; // Number of frames there's a blank after the last digit
var gamify                      = true; // Set this to "true" to get the game-y version;; else "false"
var nFeedbackFrames             = 120; // Number of frames feedback is shown (only matters if gamify = true)
var practice_nDgtsToShow        = [2,2]; // Governs the number of digits shown in the practice trials (also governs the number of practice trials--set to [] for no practice).
var nRetryFeedbackFrames        = 240; // Number of frames feedback is shown during practice when user is told to try again
// Don't change anything from here on

var blockwise_nTrials = [2,3,5,5,5,5,5];
var blockwise_nDgtsToShow = [2,3,4,5,6,7,8];
var blockwise_minCorrect = [0,0,3,3,3,3,3];
var blockCount;

var nPointsPerCorrect = 30;

var trialCount, frameCount = 0, dgtCount = 0;
var outputText = "Trial,NumbersShown,Input,NewLine,";
var dgts = [];
var isPractice = true;
var userInput;
var score = 0;
var trialwise_nDgtsToShow = practice_nDgtsToShow;
var allCorrect, nAllCorrect = 0;

var ALL = document.getElementsByTagName("html")[0];
var scoreArea = document.getElementById("scoreArea");
var dialogArea = document.getElementById("dialogArea");
var numberDisplayArea = document.getElementById("numberDisplayArea");
var inputArea = document.getElementById("inputArea");
var fieldArea = document.getElementById("fieldArea");

function startPractice(){
    blockCount = 0;
    trialCount = 0;
    if(practice_nDgtsToShow.length > 0) {
        dgts = generatePracticeStimuli();
        ALL.style.cursor = "none";
        dialogArea.style.display = "none";
        if(nBlanksBeforeCross > 0){
            window.requestAnimationFrame(function(){wait(nBlanksBeforeCross,fixationCross)});
        } else {
            window.requestAnimationFrame(fixationCross);
        }
    } else {
        startTask();
    }
}

function afterPracticeScreen(){
    blockCount = 0;
    score = 0;
    if(gamify){
        scoreArea.textContent = "Score: " + score;
        scoreArea.style.visibility = "visible";
    }
    ALL.style.cursor = "default";
    dialogArea.style.display = "block";
    dialogArea.innerHTML = "<p class='dialog'>That was the end of the practice round.<br/>\
                            Click to start the game for real<br/>\
                            (There won't be any retries from here on):</p>\
                            <button onclick='startTask()'>Start game</button>";
}

function startTask(){
    trialCount = 0;
    if(gamify) scoreArea.style.visibility = "hidden";
    dialogArea.style.display = "none";
    isPractice = false;
    ALL.style.cursor = "none";
    dgts = generateStimuli();
    if(nBlanksBeforeCross > 0){
        window.requestAnimationFrame(function(){wait(nBlanksBeforeCross,fixationCross)});
    }
    else window.requestAnimationFrame(fixationCross);
}

function fixationCross(){
    if(frameCount == 0){
        numberDisplayArea.style.display = "block";
        numberDisplayArea.textContent = "\u2022"; //dot
    }
    if(frameCount == nCrossFrames - 1){
        frameCount = 0;
        if(nBlanksAfterCross > 0){
            window.requestAnimationFrame(function(){
                numberDisplayArea.textContent = "";
                wait(nBlanksAfterCross,showDgt);});
        }
        else window.requestAnimationFrame(showDgt);
        return;
    }
    frameCount++;
    window.requestAnimationFrame(fixationCross);
}

function showDgt(){
    if(frameCount == 0){//first call
        numberDisplayArea.textContent = dgts[trialCount][dgtCount];
    }
    if(frameCount == nDgtFrames - 1){//final call
        frameCount = 0;
        dgtCount++;
        if(dgtCount == dgts[trialCount].length){//Get user input
            if(nBlanksAfterLastDigit > 0){
                window.requestAnimationFrame(function(){
                    numberDisplayArea.style.display = "none";
                    wait(nBlanksAfterLastDigit,getInput)});
            } else {
                window.requestAnimationFrame(function(){
                    numberDisplayArea.style.display = "none";
                    getInput()});
            }
        }
        else{//Show the next digit
            if(nBlanksBetweenDigits > 0){
                window.requestAnimationFrame(function(){
                    numberDisplayArea.textContent = "";
                    wait(nBlanksBetweenDigits,showDgt)});
            } else {
                window.requestAnimationFrame(showDgt);
            }
        }
        return;
    }
    frameCount++;
    window.requestAnimationFrame(showDgt);
}

function getInput(){
    ALL.style.cursor = "default";
    inputArea.style.display = "block";
    while(fieldArea.children.length > dgts[trialCount].length){
        fieldArea.removeChild(fieldArea.children[0]);
    }
    while(fieldArea.children.length < dgts[trialCount].length){
        fieldArea.appendChild(fieldArea.children[0].cloneNode());
    }
    var i;
    for(i = 0; i < fieldArea.children.length; i++){
        fieldArea.children[i].value = "";
        fieldArea.children[i].disabled = true;
    }
    fieldArea.children[0].disabled = false;
    fieldArea.children[0].focus();
    inputArea.children[0].innerHTML = "Input the digits <span style='color:blue'>IN REVERSE</span>"
}

function evaluateSubmission(){
    // Collect inputs from form fields, push onto outputText
    // Decide whether to move onto the next trial
    var i, reverseDigits = dgts[trialCount].slice(0).reverse();
    allCorrect = true;
    for(i = 0; i < fieldArea.children.length; i++){
        if(Number(fieldArea.children[i].value) != reverseDigits[i]){
            allCorrect = false;
            break;
        }
    }
    if(allCorrect){
        nAllCorrect++;
    }
    userInput = [];
    var currValue;
    for(i = 0; i < fieldArea.children.length; i++){
        if(fieldArea.children[i].value == "" || fieldArea.children[i].value == " "){
            currValue = "_";
        }
        else if(isNaN(Number(fieldArea.children[i].value))){
            currValue = fieldArea.children[i].value;
        }
        else {
            currValue = Number(fieldArea.children[i].value);
        }
        userInput.push(currValue);
    }
    outputText += (isPractice?0:(trialCount+1)) + "," +
                  dgts[trialCount].toString().replace(/,/g,'-') + "," +
                  userInput.toString().replace(/,/g,'-') + ",NewLine,";
    if(gamify){
        feedBackScreen();
    } else {
        nextTrial();
    }
}

function feedBackScreen(){
    ALL.style.cursor = "none";
    inputArea.style.display = "none";
    dialogArea.style.display = "block";
    var revDgts = dgts[trialCount].slice(0).reverse();
    //var revUserInput = userInput.slice(0).reverse();
    if(isPractice && !allCorrect){
        replay = "<p class='dialog'>Forward, the digits were:</p>\
                  <p class='replay'>";
        for(i = 0; i < dgts[trialCount].length; i++){
            replay += dgts[trialCount][i];
        }
        
        replay += "</p>\
                   <p class='dialog'>That means you should have typed:</p>\
                   <p class='replay'>"
        var revDgts = dgts[trialCount].slice(0).reverse();
        for(i = 0; i < dgts[trialCount].length; i++){
            if(revDgts[i] == userInput[i]){
                replay += "<span style='color: green;'>" + revDgts[i] + "</span>";
            } else {
                replay += "<span style='color: red;'>" + revDgts[i] + "</span>";
            }
        }
        replay += "</p>\
                   <button onclick='nextTrial()'>Try again</button>";
        ALL.style.cursor = 'default';
        dialogArea.innerHTML = replay;
    } else {
        replay = "<p class='replay'>";
        var i, nNewPoints = 0;
        for(i = 0; i < dgts[trialCount].length; i++){
            if(revDgts[i] == userInput[i]){
                nNewPoints++;
                replay += "<span style='color: green;'>" + revDgts[i] + "</span>";
            } else {
                replay += "<span style='color: red;'>" + revDgts[i] + "</span>";
            }
        }
        replay += "</p>";
        dialogArea.innerHTML = replay;
        scoreArea.style.visibility = "visible";
        scoreArea.textContent = "Score: " + score;
        for(i = 0; i < nNewPoints; i++){
            setTimeout(function(){score += nPointsPerCorrect;
                                  scoreArea.textContent = "Score: " + score;},
                                  Math.floor(nFeedbackFrames*1000/60/8) + 
                                  i*Math.floor(nFeedbackFrames*1000/60/30));
        }
        window.requestAnimationFrame(function(){wait(nFeedbackFrames,nextTrial)});
    }
}

function nextTrial(){
    if(gamify) {
        scoreArea.style.visibility = "hidden";
        dialogArea.style.display = "none";
    } else {
        inputArea.style.display = "none";
    }
    trialCount++;
    dgtCount = 0;
    ALL.style.cursor = "none";
    if(isPractice){
        if(nAllCorrect != trialCount){
            trialCount--;
        }
    }
    if(trialCount == dgts.length){
        if(isPractice){
            afterPracticeScreen();
        } else {
            saveData();
        }
        return;
    }
    if(!isPractice && dgts[trialCount-1].length && dgts[trialCount].length != dgts[trialCount-1].length){
        if(nAllCorrect < blockwise_minCorrect[blockCount]){
            saveData();
        } else {
            blockCount++;
            nAllCorrect = 0;
        }
    }
    if(nBlanksBeforeCross > 0){
        window.requestAnimationFrame(function(){
            wait(nBlanksBeforeCross,fixationCross)});
    } else {
        window.requestAnimationFrame(fixationCross);
    }
}

function generatePracticeStimuli(){
    var localDigits = [];
    trialwise_nDgtsToShow = [2,2];
    for(trialIdx = 0; trialIdx < trialwise_nDgtsToShow.length; trialIdx++){
        trialDgts = [];
        while(trialDgts.length < trialwise_nDgtsToShow[trialIdx]){
            cand = Math.floor(Math.random()*10);
            if(!trialDgts.slice(Math.max(0,trialDgts.length-noRptsWithin+1)).includes(cand)) trialDgts.push(cand);
        }
        localDigits.push(trialDgts);
    }
    return localDigits;
}
function generateStimuli(){
    var localDigits = [], i, trialwise_nDgtsToShow = [];
    for(i = 0; i < blockwise_nTrials.length; i++){
        trialwise_nDgtsToShow = trialwise_nDgtsToShow.concat(Array(blockwise_nTrials[i]).fill(blockwise_nDgtsToShow[i]));
    }
    var trialDgts, cand, trialIdx;
    for(trialIdx = 0; trialIdx < trialwise_nDgtsToShow.length; trialIdx++){
        trialDgts = [];
        while(trialDgts.length < trialwise_nDgtsToShow[trialIdx]){
            cand = Math.floor(Math.random()*10);
            if(!trialDgts.slice(Math.max(0,trialDgts.length-noRptsWithin+1)).includes(cand)) trialDgts.push(cand);
        }
        localDigits.push(trialDgts);
    }
    return localDigits;
}

function move(){
    var i = Array.prototype.slice.call(fieldArea.children).indexOf(event.target);
    if(event.key == "Backspace" && i > 0 && fieldArea.children[i].value == ""){
        fieldArea.children[i].disabled = true;
        fieldArea.children[i-1].disabled = false;
        fieldArea.children[i-1].focus();
        event.preventDefault();
    }
    
    else if(event.key == "ArrowLeft"){
        /*if(i > 0){
            fieldArea.children[i-1].focus();
        }*/
        event.preventDefault();
    }
    else if(event.key == "ArrowRight" && i < fieldArea.children.length-1){
        fieldArea.children[i].disabled = true;
        fieldArea.children[i+1].disabled = false;
        fieldArea.children[i+1].focus();
    }
}

function autotab(){
    var i = Array.prototype.slice.call(fieldArea.children).indexOf(event.target);
    if(i < fieldArea.children.length-1 && fieldArea.children[i].value != ""){
        fieldArea.children[i].disabled = true;
        fieldArea.children[i+1].disabled = false;
        fieldArea.children[i+1].focus();
    }
    if(fieldArea.children[i].value == " "){
        fieldArea.children[i].value = "";
    }
}