const express = require('express')
const app = express()
const util = require('util')
const Buzz = require("./buzz/buzzers.js")
const fs = require('fs')

var audioFiles = fs.readdirSync('./public/wav/');

const storeData = (data, path) => {
  try {
    fs.writeFileSync(path, JSON.stringify(data))
  } catch (err) {
    util.log("Error: ", err)
  }
}

const loadData = (path) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (err) {
    util.log(`Error: not able to load ${path}.`)
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
	solutionOrder: "blue-orange-green-yellow",
	solutionBuzzer: "none",
	score: 0,
	scoreMinus: 0,
	scoreArray: [],
	timer: 10,
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
	modus: "waiting",
	lightState: [],
	flashing: true,
	buzzerSounds: true
}

// Load questions
var questions = loadData("questions.txt")
if(!questions) {
	questions = loadData("sample.txt")
	storeData(questions, "questions.txt")
	util.log(`Loading sample file.`)
}
util.log(questions.length + ' questions loaded.')

// Sending flashing inforation to client
var emitLight = false
var flash = 0

// Winner index
var winnerIndex = 0

// Clock counter
var clockCounter = 0
var clockActive = false

// Listen on every connection
io.on('connection', function(socket) {
	util.log(`User connected: ${socket.id}.`)
	
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
		if(state.modus == "ready") {
			resetQuestion()
		} else if(state.modus == "active") {
			evaluateQuestion()
		} else {
			startQuestion()
		}
	})
	
	// Ready state received
	socket.on("ready", function() {
		resetQuestion()
		sendStatus()
	})
	
	// Active state received
	socket.on("active", function() {
		startQuestion()
	})
	
	// Finished state received
	socket.on("finished", function() {
		evaluateQuestion()
	})
	
	// Finished state received
	socket.on("results", function() {
		if(state.currentQuestion.questionMode == "buzzer") {
			calculateBuzzer()
		} else if (state.currentQuestion.questionMode == "multisteal") {
			if(state.correct.includes(true)) {
				stealScores()
			}
		} else {
			state.flashing = false
		}
	})
	
	// Request questions
	socket.on("getQuestions", function() {
		io.to(socket.id).emit('questions', questions)
	})
	
	// Update question
	socket.on("updateQuestion", function() {
		questions[state.currentQuestion.id] = state.currentQuestion
		storeData(questions, "questions.txt")
		io.emit('questions', questions)
		util.log("Updated question " + (state.currentQuestion.id + 1) + ".")
	})
	
	// Add a new question
	socket.on("newQuestion", function() {
		state.currentQuestion.id = questions.length
		questions.push(state.currentQuestion)
		storeData(questions, "questions.txt")
		io.emit('questions', questions)
		util.log("Added new question.")
	})

	// Move question to position
	socket.on("moveTo", function(msg) {
		if (msg >= 0 && msg < questions.length) {
			util.log("Moved question", (state.currentQuestion.id + 1), "to position", (msg + 1), ".")
			questions.splice(state.currentQuestion.id, 1)
			questions.splice(msg, 0, state.currentQuestion)
			let index = 0
			// Renumber the questions
			for(let i = 0; i < questions.length; i++) {
				questions[i].id = i
			}
			storeData(questions, "questions.txt")
			state.currentQuestion.id = msg
			sendStatus()
			io.emit('questions', questions)
		}
	})

	// Send current list of available audio files
	socket.on("getAudioFiles", function() {
		io.emit('audioFiles', audioFiles)
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
	
	// Receive background image
	socket.on('img', function(msg) {
		io.emit('showImg', msg)
	})

	// Receive background video
	socket.on('video', function(msg) {
		io.emit('showVideo', msg)
	})
	
	// Receive background audio
	socket.on('audio', function(msg) {
		io.emit('showAudio', msg)
	})
	
	// Reveive changed number of players
	socket.on('numberPlayers', function(msg) {
		util.log('Changed number of players to', msg)
		state.numberOfPlayers = msg
	})
	
	// Send list of rounds
	socket.on('getAllRounds', function() {
		io.emit('rounds', getAllRounds())
	})
	
	// Delete question
	socket.on('delete', function(msg) {
		deleteQuestion(msg)
	})
	
})

// Routes
app.get('/', (req, res) => {
	res.render('dashboard')
})

app.get('/scores', (req, res) => {
	res.render('scores')
})

app.get('/questions', (req, res) => {
	res.render('questions')
})

// Initialize Buzz controllers
const buzz = new Buzz({});
state.numberOfPlayers = buzz.getNumberOfControllers();

// Idle animation which turns on each LED in turn.
var flashIndex = -1
var flashCounter = -1
var lightStateFlash = []

if(state.numberOfPlayers == 0) {
	util.log("Simulation mode started.")
	state.numberOfPlayers = 8
} else {
	util.log("Ready! Press a button on any controller!")
}

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
			if(emitLight) {
				flash = flashIndex % state.numberOfPlayers
				io.emit('flash', flash)
			}
		}
	} else {
		for (i = 0; i < state.numberOfPlayers; i++) {
			lightStateFlash[i] = false;
		}		
	}
}, 100)

setInterval(function() {
	if(clockActive) {
		io.emit('clock', clockCounter)
		if(clockCounter > 0) {		
			clockCounter--
		} else {
			clockActive = false
			state.modus = "finished"
			evaluateQuestion()
		}
	}
}, 1000)


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
	if(state.currentQuestion.timer) {
		clockCounter = state.currentQuestion.timer
	} else {
		clockCounter = 20
	}
	clockActive = true
	switch(state.currentQuestion.questionMode) {
		case "multiple":
		case "multifirst":
		case "multisteal":
		case "inorder":
		case "buzzer":
			state.flashing = false
			allLights(true)
			state.modus = "active"
			break;
		default:
	}
	sendStatus()
}

// Evaluate question
function evaluateQuestion() {
	state.modus = "finished"
	clockActive = false
	if(state.modus != "buzzer") {
		allLights(false)
		state.flashing = false
	}
	switch(state.currentQuestion.questionMode) {
		case "multiple":
		case "multifirst":
		case "multisteal":
		case "inorder":
			state.flashing = false
			state.modus = "finished"
			break
		case "buzzer":
			state.flashing = false
			state.modus = "finished"
			break
		default:
	}
	sendStatus()
}

// Calculate buzzer points
function calculateBuzzer() {
	for(let i = 1; i <= state.numberOfPlayers; i++) {
		let playerIndex = state.speedSequence.indexOf(i)
		if(playerIndex != -1) {
			if(state.correct[playerIndex]) {
				state.scoresDelta[playerIndex] = parseInt(state.currentQuestion.score)
				break
			} else {
				if(state.currentQuestion.scoreMinus) {
					state.scoresDelta[playerIndex] = -parseInt(state.currentQuestion.scoreMinus)
				}
			}
		} else {
			break
		}
	}
	sendStatus()
}

// Steal scores
function stealScores() {
	winnerIndex = state.correct.indexOf(true)
	allLights(false)
	state.flashing = true
	state.lightState[winnerIndex] = true
	emitLight = true
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
	allLights(false)
	
	storeData(state, "latestStatus.txt")
}

// All lights on
function allLights(onOff) {
	for (i = 0; i < state.numberOfPlayers; i++) {
		state.lightState[i] = onOff
	}
}

// Get all rounds
function getAllRounds() {
	let allRounds = []
	for(let i = 0; i < questions.length; i++) {
		if(!allRounds.includes(questions[i].round)) {
			allRounds.push(questions[i].round)
		}
	}
	return allRounds
}

// Delete question
function deleteQuestion(msg) {
	if (msg >= 0 && msg < questions.length) {
		questions.splice(parseInt(msg), 1)
		// Renumber the questions
		for(let i = 0; i < questions.length; i++) {
			questions[i].id = i
		}
		storeData(questions, "questions.txt")
		state.currentQuestion = questions[parseInt(msg)]
		sendStatus()
		io.emit('questions', questions)
		util.log(`Deleted question ${msg + 1}.`)		
	}
}

// Light controllers with a button pressed down
buzz.on("buttondown",function(event) {
	if(event.controllerId < state.numberOfPlayers) {
		var playerNumber = parseInt(event.controllerId) + 1
		var playerName = `Buzz ${playerNumber}`
		util.log(`${playerName} pushed ${event.button}`)
		io.sockets.emit('new_message', {message : event.button, username : playerName, playerId : playerNumber})
		if(state.buzzerSounds) {
			io.emit('sound', event.controllerId)
		}
		switch(state.currentQuestion.questionMode) {
			
			// Simple multiple choice questions (no limits)
			case "multiple":
				// Player pushed multiple choice button once
				if(state.modus == "active" &&
				   state.selectedButtons[event.controllerId] == "none" &&
				   event.button != "red") {
					   
					// Register pushed button
					state.selectedButtons[event.controllerId] = event.button
					state.numberOfReplies++
					
					// Player has submitted answer, which is instantly evaluated
					if(event.button == colorCode[state.currentQuestion.solution]) {
						state.correct[event.controllerId] = true
						state.scoresDelta[event.controllerId] = parseInt(state.currentQuestion.score)
					} else {
						state.correct[event.controllerId] = false
						if(state.currentQuestion.scoreMinus) {
							state.scoresDelta[event.controllerId] = -parseInt(state.currentQuestion.scoreMinus)
						}
					}
					
					// Turn red light off
					state.lightState[event.controllerId] = false
					
					// Update status 
					sendStatus()
					
					// All players have submitted their answer
					if(state.numberOfReplies == state.numberOfPlayers) {
						evaluateQuestion()
					}
				}
				break
			
			// Multiple choice, only fastest correct answer counts
			case "multifirst":
			case "multisteal":
				// Player pushed multiple choice button once
				if(state.modus == "active" &&
				   state.selectedButtons[event.controllerId] == "none" &&
				   event.button != "red") {
					
					// Register pushed button
					state.selectedButtons[event.controllerId] = event.button
					state.numberOfReplies++
					state.speedSequence[event.controllerId] = state.numberOfReplies
					
					if(state.currentQuestion.scoreArray[0] != null && state.currentQuestion.questionMode != "multisteal") {
						// All players can submit a correct question
						if(event.button == colorCode[state.currentQuestion.solution]) {
							state.correct[event.controllerId] = true
							let score = 0
							let scoreIndex = -1
							for(let i = 1; i <= state.numberOfReplies; i++) {
								if(state.correct[state.speedSequence.indexOf(i)]) {
									scoreIndex++
								}
							}
							if(scoreIndex < state.currentQuestion.scoreArray.length) {
								// Select element in scoreArray that matches position
								score = state.currentQuestion.scoreArray[scoreIndex]
							} else {
								// Select last element from scoreArray
								score = state.currentQuestion.scoreArray[state.currentQuestion.scoreArray.length - 1]
							}
							state.scoresDelta[event.controllerId] = parseInt(score)
						} else {
							if(state.currentQuestion.scoreMinus) {
								state.scoresDelta[event.controllerId] = -parseInt(state.currentQuestion.scoreMinus)
							}
						}				
					} else {
						// One player has submitted a correct answer and all stops
						if(event.button == colorCode[state.currentQuestion.solution]) {
							state.correct[event.controllerId] = true
							if(state.currentQuestion.questionMode != "multisteal") {
								state.scoresDelta[event.controllerId] = parseInt(state.currentQuestion.score)
							}
							evaluateQuestion()
						}
					}
					
					// Turn red light off
					state.lightState[event.controllerId] = false
					
					// Update status
					sendStatus()
					
					// All players have submitted their answer, all are wrong
					if(state.numberOfReplies == state.numberOfPlayers) {
						evaluateQuestion()
					}
				} else if(state.modus == "results" &&
						  event.controllerId == winnerIndex &&
						  event.button == "red") {
					emitLight = false
					let looserIndex = flash
					let booty = parseInt(state.scores[looserIndex] * 0.2)
					state.scoresDelta[looserIndex] = -booty
					if(winnerIndex == looserIndex) {
						util.log("Player " + (looserIndex + 1) + " looses.")					
					} else {					
						state.scoresDelta[winnerIndex] = booty
						util.log("Player " + (looserIndex + 1) + " looses from player " + (winnerIndex + 1))
					}
				}
				break		
			
			case "buzzer":
				// Player pushed red button once
				if(state.modus == "active" &&
				   state.selectedButtons[event.controllerId] == "none" &&
				   event.button == "red") {
					   
					// Register pushed button
					state.selectedButtons[event.controllerId] = "red"
					state.numberOfReplies++
					state.speedSequence[event.controllerId] = state.numberOfReplies
					
					// First player to push leaves the red light on
					if(state.numberOfReplies == 1) {
						allLights(false)
						state.correct[event.controllerId] = true
						state.lightState[event.controllerId] = true
					}
					
					// Update status 
					sendStatus()
					
					// All players have submitted their answer
					if(state.numberOfReplies == state.numberOfPlayers) {
						evaluateQuestion()
					}
				}
				break
				
			// Set in order, a sequence of four unique buttons needs to be pushed
			case "inorder":
				if(state.modus == "active" &&
				   event.button != "red" &&
				   state.selectedButtons[event.controllerId].indexOf(event.button) == -1) {
					   
					// Register series of pushed buttons
					if(state.selectedButtons[event.controllerId] == "none") {
						state.selectedButtons[event.controllerId] = event.button
					} else {
						state.selectedButtons[event.controllerId] = state.selectedButtons[event.controllerId] + "-" + event.button
					}
					
					// Check if sequence of player inputs is complete and validate question
					if(state.selectedButtons[event.controllerId].length == 24) {
						if(state.selectedButtons[event.controllerId] == state.currentQuestion.solutionOrder) {
							state.correct[event.controllerId] = true
							state.scoresDelta[event.controllerId] = parseInt(state.currentQuestion.score)
						} else {
							state.correct[event.controllerId] = false
							if(state.currentQuestion.scoreMinus) {
								state.scoresDelta[event.controllerId] = -parseInt(state.currentQuestion.scoreMinus)
							}
						}
						state.lightState[event.controllerId] = false
						state.numberOfReplies++
					}
					
					// Update status
					sendStatus()
					
					// All players have submitted their answer, all are wrong
					if(state.numberOfReplies == state.numberOfPlayers) {
						evaluateQuestion()
					}
					
					util.log("Player " + (event.controllerId + 1) + " - " + state.selectedButtons[event.controllerId] + ".")
				}
				break
			
			default:
				state.selectedButtons[event.controllerId] = event.button
				state.lightState[event.controllerId] = true
				buzz.light(state.lightState)
				sendStatus()
		}
	}
})

// Button released, just for switching off the LED's
buzz.on("buttonup",function(event) {
	if(event.controllerId < state.numberOfPlayers) {
		switch(state.currentQuestion.questionMode) {
			case "multiple":
			case "buzzer":
			case "inorder":
				break
			default:
				state.lightState[event.controllerId] = false
		}
		buzz.light(state.lightState)
		sendStatus()
	}
})
