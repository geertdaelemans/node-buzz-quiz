const express = require('express')
const app = express()
const util = require('util')
const Buzz = require("./buzz/buzzers.js")
const fs = require('fs')

const storeData = (data, path) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data))
  } catch (err) {
    util.error(err)
  }
}

const loadData = (path) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (err) {
    util.error(err)
    return false
  }
}

// Set the template engine ejs
app.set('view engine', 'ejs')

// Middleware
app.use(express.static('public'))

// Listen on port 3000
server = app.listen(3000)

// Socket.io instantiation
const io = require("socket.io")(server)

// Color Code Buzzers
const colorCode = ["blue", "orange", "green", "yellow"]

// Question
var question = {
	id: 0,
	round: '0',
	category: 'none',
	questionMode: 'multiple',
	question: 'empty',
	answers: [],
	solution: 0,
	score: 0,
	remarks: 'none'
}

// Status
var state = {
	numberOfPlayers: 0,
	names: [],
	scores: [],
	scoresDelta: [],
	selectedButtons: [],
	speedSequence: [],
	correct: [],
	numberOfReplies: 0,
	currentQuestion: question,
	title: "",
	questionMode: "scoreboard",
	questionActive: false,
	lightState: [],
	flashing: true
}

/*
CODE SNIPPET TO GENERATE EXAMPLE QUESTIONS

question.answer[0] = 'blue';
question.answer[1] = 'orange';
question.answer[2] = 'green';
question.answer[3] = 'yellow';

var round = []
round[0] = question
round[1] = question

util.log("Writing file with contens", round)

storeData(round, "sample.txt")
*/

// Load questions
var questions = loadData("questions.txt")
util.log(questions.length + ' questions loaded.')

// Listen on every connection
io.on('connection', function(socket) {
	util.log('User connected: ' + socket.id)
	
	// Default username
	socket.username = "Anonymous"
	
	// Client asks for general status
	socket.on('getStatus', function() {
		sendStatus(socket.id)
	})
	
	// Get lightState
	socket.on('light', (data) => {
		if (state.lightState[data.number]) {
			state.lightState[data.number] = false
			util.log("Buzzer ", data.number, " switched off.")
		} else {
			state.lightState[data.number] = true
			util.log("Buzzer ", data.number, " switched on.")
		}
		sendStatus()
	})	
	
	// Listen on change_username
	socket.on('change_username', (data) => {
		socket.username = data.username
		util.log("Username changed: ", socket.username)
	})
	
    // Listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', {message : data.message, username : socket.username});
    })
	
	// Listen on add scores
    socket.on('addScores', (data) => {
		resetQuestion()
        sendStatus()
    })
	
	// Listen on statusUpdate
	socket.on('updateStatus', function(value) {
		state = value
		sendStatus()
	});	
	
	// Name update
	socket.on("name",function(msg) {
		state.names[msg.player] = msg.value
		sendStatus()
	})
	
	// Start question received
	socket.on("start", function(msg) {
		if(state.questionActive) {
			evaluateQuestion()
		} else {
			startQuestion()
		}
	})
	
	// Request questions
	socket.on("getQuestions", function() {
		io.to(socket.id).emit('questions', questions);
	})
	
	// Update question
	socket.on("updateQuestion", function() {
		util.log("Update received")
		questions[state.currentQuestion.id] = state.currentQuestion
		storeData(questions, "questions.txt")
		io.emit('questions', questions);
	})

	// Next question
	socket.on("nextQuestion", function() {
		let index = 0
		if(state.currentQuestion.id < questions.length - 1) {
			index = state.currentQuestion.id + 1
		}
		state.currentQuestion = questions[index]
		state.title = ""
		sendStatus()
	})
	
	// Previous question
	socket.on("previousQuestion", function() {
		let index = questions.length - 1
		if(state.currentQuestion.id > 0) {
			index = state.currentQuestion.id - 1
		}
		state.currentQuestion = questions[index]
		state.title = ""
		sendStatus()
	})
})

// Routes
app.get('/dashboard', (req, res) => {
	res.render('dashboard')
})

app.get('/', (req, res) => {
	res.render('scores')
})

// Initialize Buzz controllers
const buzz = new Buzz({});
state.numberOfPlayers = buzz.getNumberOfControllers();

// Idle animation which turns on each LED in turn.
var flashIndex = -1
var flashCounter = -1
var lightStateFlash = []

for (i = 0; i < state.numberOfPlayers; i++) {
  lightStateFlash[i] = false
  state.lightState[i] = false
  state.scores[i] = 0
  state.scoresDelta[i] = 0
  state.correct[i] = false
  state.names[i] = "Ploeg " + parseInt(i+1)
  state.selectedButtons[i] = "none"
  state.speedSequence[i] = 0
}

setInterval(function() {
	var ls = []
	for (i = 0; i < state.numberOfPlayers; i++) {
		ls[i] = false;
	}
	for (var i in state.lightState)
		ls[i] = lightStateFlash[i] || state.lightState[i]
    buzz.light(ls)
},10)

setInterval(function() {
	flashCounter++
	if (state.flashing) {
		if(!(flashCounter % 2)) {
			flashIndex++;
			for (i = 0; i < state.numberOfPlayers; i++) {
				lightStateFlash[i] = false;
			}
			lightStateFlash[flashIndex % state.numberOfPlayers] = true
		}
	} else {
		for (i = 0; i < state.numberOfPlayers; i++) {
			lightStateFlash[i] = false;
		}		
	}
}, 100)


// Send status to client(s)
function sendStatus(clientID) {
	if (clientID) {
		io.to(clientID).emit('status', state);
	}
	else {
		io.emit('status', state);
	}
}

// Start question
function startQuestion() {
	switch(state.questionMode) {
		case "multiple":
		case "multifirst":
			state.flashing = false
			state.questionActive = true
			break;
		case "buzzer":
			state.flashing = false
			state.questionActive = true
			break;
		default:
	}
	resetQuestion()
	sendStatus()
}

// Evaluate question
function evaluateQuestion() {
	switch(state.questionMode) {
		case "multiple":
			state.flashing = false
			state.questionActive = false
			for(i = 0; i < state.numberOfPlayers; i++) {
				if(state.correct[i]) {
					state.scoresDelta[i] = state.currentQuestion.score
				}
			}
			break;
		case "buzzer":
			state.flashing = false
			state.questionActive = false
			for(i = 0; i < state.numberOfPlayers; i++) {
				if(state.correct[i]) {
					state.scoresDelta[i] = state.currentQuestion.score
				}
			}
			break;
		default:
	}
	sendStatus()
}

// Reset question
function resetQuestion() {
	for (i = 0; i < state.numberOfPlayers; i++) {
		state.scores[i] += parseInt(state.scoresDelta[i])
		state.scoresDelta[i] = 0
		state.correct[i] = false
		state.selectedButtons[i] = "none"
		state.speedSequence[i] = 0
	}
	state.numberOfReplies = 0
	
	storeData(state, "latestStatus.txt")
}

// Light controllers with a button pressed down
buzz.on("buttondown",function(event) {
	var playerNumber = parseInt(event.controllerId) + 1
	var playerName = `Buzz ${playerNumber}`
	util.log(`${playerName} pushed ${event.button}`)
	io.sockets.emit('new_message', {message : event.button, username : playerName, playerId : playerNumber})
	switch(state.questionMode) {
		
		// Simple multiple choice questions (no limits)
		case "multiple":
			// Player pushed multiple choice button once
			if(state.selectedButtons[event.controllerId] == "none" &&
			   event.button != "red") {
				state.selectedButtons[event.controllerId] = event.button
				state.numberOfReplies++
				state.speedSequence[event.controllerId] = state.numberOfReplies
				if(event.button == colorCode[state.currentQuestion.solution]) {
					state.correct[event.controllerId] = true
					state.scoresDelta[event.controllerId] = state.currentQuestion.score
				}
				state.lightState[event.controllerId] = true
				buzz.light(state.lightState)
				sendStatus()
			}
			break
		
		// Multiple choice, only fastest correct answer counts
		case "multifirst":
			// Player pushed multiple choice button once
			if(state.questionActive == true &&
			   state.selectedButtons[event.controllerId] == "none" &&
			   event.button != "red") {
				state.selectedButtons[event.controllerId] = event.button
				state.numberOfReplies++
				state.speedSequence[event.controllerId] = state.numberOfReplies
				if(event.button == colorCode[state.currentQuestion.solution]) {
					state.correct[event.controllerId] = true
					state.scoresDelta[event.controllerId] = state.currentQuestion.score
					state.questionActive = false
				}
				state.lightState[event.controllerId] = true
				buzz.light(state.lightState)
				sendStatus()
			}
			break		
		
		case "buzzer":
			// Player pushed red button once
			if(state.selectedButtons[event.controllerId] == "none" &&
			   event.button == "red") {
				state.selectedButtons[event.controllerId] = "red"
				state.numberOfReplies++
				state.speedSequence[event.controllerId] = state.numberOfReplies
				state.lightState[event.controllerId] = true
				buzz.light(state.lightState)
				sendStatus()				
			}
			break
		default:
			state.selectedButtons[event.controllerId] = event.button
			state.lightState[event.controllerId] = true
			buzz.light(state.lightState)
			sendStatus()
	}
})

// Button released, just for switching off the LED's
buzz.on("buttonup",function(event) {
    state.lightState[event.controllerId] = false
    buzz.light(state.lightState)
	sendStatus()
})

util.log("Ready! Press a button on any controller!")