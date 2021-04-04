let SpeechRecognition = webkitSpeechRecognition
let SpeechRecognitionEvent = webkitSpeechRecognitionEvent

interact('.draggable')
    .draggable({
        inertia: true,
        modifiers: [
            interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
            })
        ],
        autoScroll: true,

        listeners: {
            move: dragMoveListener,
        }
    })

function dragMoveListener (event) {
    var target = event.target

    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

    target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

    target.setAttribute('data-x', x)
    target.setAttribute('data-y', y)
}

window.dragMoveListener = dragMoveListener;

let url;
let database;
let drawButton, saveButton, cancelButton;
let speak;
let result;
let saves = [];
let currDrawing = [];
let currStrokeIndex = [];
let xPoints = [];
let yPoints = [];
let i = 0;
let value;
let valueWords;
let valueWordsIdx = 0;
let randomStroke, randomColor;
let writing = false;

let x, y;
let strokeIndex = 0;
let index = 0;
let drawing;
let prevx, prevy;
let randomPositionX, randomPositionY;
let randomNumberX, randomNumberY;
let xPos, yPos;

let recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false;

let hand1, hand2, hand3;

function preload() {
    hand1 = loadFont('font/hand-1.otf');
    hand2 = loadFont('font/hand-2.otf');
    hand3 = loadFont('font/hand-3.otf');
}

function setup() {
    let canvas = createCanvas(4200, 2625);
    canvas.parent('main');
    document.querySelector('canvas').classList.add('draggable');

    let a = document.querySelector('canvas')
    a.onmousemove = getPos;

    // firebase configuration 
    var firebaseConfig = {
        apiKey: "AIzaSyDQ3ujBMzgG9PZWO9iku__DSKfka76E-uc",
        authDomain: "draw-sketch4.firebaseapp.com",
        databaseURL: "https://draw-sketch4-default-rtdb.firebaseio.com/",
        projectId: "draw-sketch4",
        storageBucket: "draw-sketch4.appspot.com",
        messagingSenderId: "564106442122",
        appId: "1:564106442122:web:f852e6e77be89409fd0473"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();

    let ref = database.ref('userDrawings');
    ref.on('value', gotData, err);

    drawButton = document.getElementById('button-draw');
    drawButton.onclick = newDrawing;

    saveButton = document.getElementById('button-save');
    saveButton.onclick = save;

    cancelButton = document.getElementById('button-cancel');
    cancelButton.onclick = cancel;

    speak = document.getElementById('speak-draw');
    result = document.getElementById('speech-result');
}


const newDrawing = () => {
    recognition.start();

    drawButton.style.display = 'none';
    saveButton.style.display = 'block';
    cancelButton.style.display = 'block';
    speak.style.display = 'block';

    recognition.onresult = showResult;
}

const getURL = (keyword) => {
    let url = `https://quickdrawfiles.appspot.com/drawing/${keyword}?key=AIzaSyC1_soqtXV1mTyetVpJ4GglGD5RtXuFp4o&isAnimated=true&format=canvas%20drawing`;
    return url
};

const showResult = (event) => {
    let speechLength = event.results.length;
    let idx = speechLength - 1;
    let speechResult = event.results[idx][0];
    let resultString = speechResult.transcript;

    let result = document.getElementById('speech-result');
    result.innerHTML = resultString;

    value = resultString.trim();
    let valueLowerCase = value.toLowerCase();

    let valueWordsCapitalize = value.split(' ');
    let valueWordsCapitalized = [];

    for (let i=0; i<valueWordsCapitalize.length; i++) {
        valueWordsCapitalized[i] = valueWordsCapitalize[i].capitalize();
    }

    valueWordsCapitalized = valueWordsCapitalized.join(' ');

    if (categories.includes(valueLowerCase)) {
        url = getURL(value.toLowerCase());
    } else if (categories.includes(valueWordsCapitalized)) {
        url = getURL(value.capitalize());
    } else {
        valueWords = value.split(' ');
        valueWords = valueWords.filter(ele => categories.includes(ele)); 

        url = getURL(valueWords[0]);
    }

    if (valueWords.length === 0) {
        gotDrawing(value);
    } else {
        loadJSON(url, gotDrawing, err); 
    }
}

function draw() {
    if (drawing) {
        x = drawing[strokeIndex][0][index] + randomPositionX;
        y = drawing[strokeIndex][1][index] + randomPositionY;

        if (x && y) {
            xPoints.push(x);
            yPoints.push(y);
        }

        stroke(randomColor[0], randomColor[1], randomColor[2]);
        strokeWeight(randomStroke);

        if (prevx !== undefined) {
            line(prevx, prevy, x, y);
        }

        index++;

        if (index >= drawing[strokeIndex][0].length) {
            currStrokeIndex[0] = xPoints;
            currStrokeIndex[1] = yPoints;
            currDrawing[strokeIndex] = currStrokeIndex;

            // reset 
            xPoints = [];
            yPoints = [];
            currStrokeIndex = [];

            strokeIndex++;
            prevx = undefined;
            prevy = undefined;
            index=0;

            if (strokeIndex === drawing.length) {
                drawing = undefined;
                saves = currDrawing;
                strokeIndex = 0;
                valueWordsIdx++;

                if (valueWords !== undefined) {
                    if (valueWordsIdx === valueWords.length) {
                        drawing = undefined;
                        saves = currDrawing;
                        strokeIndex = 0;
                    } else {
                        url = getURL(valueWords[valueWordsIdx])
                        loadJSON(url, gotDrawing, err); 
                    }
                }
            } 
        } else {
            prevx = x;
            prevy = y;
        }
    } else if (writing) {
        let fontSize = randomFontSize();

        noStroke();
        fill(randomColor);
        textFont(hand2);
        textSize(fontSize);
        text(value, randomPositionX, randomPositionY);

        writing = false;
    }
}

const gotDrawing = (data) => {
    if (valueWords.length === 0) {
        writing = true;
    }
 
    drawing = data.drawing;

    let siteWidth = document.body.clientWidth;
    let x = [];
    x.push(xPos);

    randomNumberX = Math.floor(Math.random() * 500);

    if (x[0] < siteWidth - 200) {
        randomPositionX = randomNumberX; 
    } else {
        randomPositionX = randomNumberX + x[0] - 300;
    }

    let siteHeight = document.body.clientHeight;
    let y = [];
    y.push(yPos);

    randomNumberY = Math.floor(Math.random() * (Math.floor(siteHeight / 2)));

    if(y[0] < siteHeight - 250) {
        randomPositionY = randomNumberY;
    } else {
        randomPositionY = y[0] - randomNumberY - 400;
    }

    randomStroke = getRandomStroke();
    randomColor = getRandomColor();
}

const cancel = () => {
    recognition.stop();

    drawButton.style.display = 'block';
    saveButton.style.display = 'none';
    cancelButton.style.display = 'none';
    speak.style.display = 'none';
    result.innerHTML = '. . .';
}

const save = () => {
    recognition.stop();

    drawButton.style.display = 'block';
    saveButton.style.display = 'none';
    cancelButton.style.display = 'none';
    speak.style.display = 'none';
    result.innerHTML = '. . .';

    let ref = database.ref('userDrawings');

    let data = {
        drawing: saves,
        stroke_weight: randomStroke,
        color: randomColor, 
    }
    console.log(data);

    ref.push(data);
}

const loadDrawings = (data) => {
    let loadedDrawing = data.drawing;
    let stroke_weight = data.stroke_weight;
    let color = data.color;

    for (let path of loadedDrawing) {
        noFill();
        stroke(color[0], color[1], color[2]);
        strokeWeight(stroke_weight);
        beginShape();
        for (let i=0; i<path[0].length; i++) {
            let x = path[0][i];
            let y = path[1][i];

            vertex(x,y);
        }
        endShape();
    }
}

const gotData = (data) => {
    let drawings = data.val();
    let keys = Object.keys(drawings);

    for (let i=0; i<keys.length;i++) {
        let key = keys[i];
        loadDrawings(drawings[key])
    }
}

const err = (err) => {
    console.log(err);
}

const getPos = (e) =>{
    xPos = e.offsetX;
    yPos = e.offsetY;
}

const getRandomStroke = () => {
    return Math.floor(Math.random() * (11 - 3) + 3);
}

const getRandomColor = () => {
    let color = [1,2,3].map(x=>Math.random()*256|0);
    return color;
}

const randomFontSize = () => {
    return Math.floor(Math.random() * (71 - 30) + 30);
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}