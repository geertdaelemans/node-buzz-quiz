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

// Get question mode for display
function getQuestionMode() {
	switch(state.currentQuestion.questionMode) {
		case "multiple":
			return "Multiple Choice"
		case "multifirst":
			return "Multiple Choice Snelheid"
		case "buzzer":
			return "Buzzer"
		case "inorder":
			return "Zet in volgorde"
		default:
			return "Multiple Choice"
	}
}

// Activate the correct panel
function activatePanel(name) {
	switch(name) {
	case "waiting":
		$("#readyPanel").hide()
		$("#singlePanel").hide()
		$("#multiplePanel").hide()
		$("#resultsPanel").hide()
		$("#waitingPanel").show()	// Active
		break
	case "ready":
		$("#waitingPanel").hide()
		$("#singlePanel").hide()
		$("#multiplePanel").hide()
		$("#resultsPanel").hide()
		$("#readyPanel").show()		// Active
		break
	case "open":
		$("#waitingPanel").hide()
		$("#readyPanel").hide()
		$("#multiplePanel").hide()
		$("#resultsPanel").hide()
		$("#singlePanel").show()	// Active
		break
	case "multiple":
		$("#waitingPanel").hide()
		$("#readyPanel").hide()
		$("#singlePanel").hide()
		$("#resultsPanel").hide()
		$("#multiplePanel").show()	// Active
		break
	case "answer":
		$("#waitingPanel").hide()
		$("#readyPanel").hide()
		$("#singlePanel").hide()
		$("#multiplePanel").hide()
		$("#resultsPanel").show()	// Active
		break
	default:
		$("#readyPanel").hide()
		$("#singlePanel").hide()		
		$("#multiplePanel").hide()
		$("#resultsPanel").hide()
		$("#waitingPanel").show()	// Active
	}
}

// Refresh the questions page
function refreshPage() {
	switch(state.modus) {
		case "waiting":
			activatePanel("waiting")
			break
		case "ready":
			$('#questionMode').html(getQuestionMode())
			activatePanel("ready")
			break
		case "active":
		case "finished":
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
			break
		case "results":
			activatePanel("answer")
			break
		default:
			activatePanel("waiting")
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
