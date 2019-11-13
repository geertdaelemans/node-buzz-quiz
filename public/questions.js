var socket = io.connect('http://localhost:3000')

var pageLoaded = false

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

$(function(){
	socket.emit('getStatus')	
})

// Initialize the scores page
function setupPage() {
	pageLoaded = true
	refreshPage()
}

// Activate the correct panel
function activatePanel(name) {
	switch(name) {
	case "open":
		$("#multiplePanel").hide()
		$("#singlePanel").show()
		break
	case "multiple":
		$("#singlePanel").hide()
		$("#multiplePanel").show()
		break
	default:
		$("#multiplePanel").hide()
		$("#singlePanel").show()
	}
}

// Refresh the questions page
function refreshPage() {
	if(state.questionActive) {
		if(state.questionMode == "buzzer") {
			activatePanel("open")
			$("#questionSingle").html(state.currentQuestion.question)
		} else {
			activatePanel("multiple")
			$("#questionMultiple").html(state.currentQuestion.question)
			$("#answerBlue").html(state.currentQuestion.answers[0])
			$("#answerOrange").html(state.currentQuestion.answers[1])
			$("#answerGreen").html(state.currentQuestion.answers[2])
			$("#answerYellow").html(state.currentQuestion.answers[3])
		}
	}
}

// Receive status and parse
socket.on('status', function(msg) {
	console.log(msg)
	state = msg
	if (!pageLoaded) {
		setupPage()
		pageLoaded = true
	} else {
		refreshPage()
	}
})
