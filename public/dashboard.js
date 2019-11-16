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
	modus: "waiting",
	lightState: [],
	flashing: true
}

const colorCode = ["blue", "orange", "green", "yellow"]

var questionsList = []

$(function(){
	socket.emit('getStatus')
	
	// Buttons and inputs
	var message = $("#message")
	var username = $("#username")
	var control = $("#control")
	var feedback = $("#feedback")	
	
	//Emit message
	$("#send_message").click(function() {
		socket.emit('new_message', {message : message.val()})
	})

	//Emit a username
	$("#send_username").click(function() {
		socket.emit('change_username', {username : username.val()})
	})
	
	// Trigger add scores
	$("#addScores").click(function() {
		socket.emit('addScores')
	})	

	// Change flashing mode
	$("#flashing").change(function() {
        state.flashing = this.checked
		socket.emit('updateStatus', state)
    });
	
	// Set waiting modus
	$("#buttonWaiting").click(function() {
		if(state.modus == "results") {
			state.modus = "waiting"
			state.flashing = true
			socket.emit('updateStatus', state)
			console.log("socket.emit('nextQuestion')")
			socket.emit('nextQuestion')
		} else {
			state.modus = "waiting"
			state.flashing = true
			socket.emit('updateStatus', state)			
		}
    })
	
	// Set ready modus
	$("#buttonReady").click(function() {
		updateCurrentQuestion()
		state.title = $("#title").val()
		state.questionMode = $("#questionmode").val()
		state.flashing = true
		state.modus = "ready"
		socket.emit('updateStatus', state)
		socket.emit('ready')
    })	
	
	// Set active modus
	$("#buttonActive").click(function() {
		updateCurrentQuestion()
		state.title = $("#title").val()
		state.questionMode = $("#questionmode").val()
		state.modus = "active"
		socket.emit('updateStatus', state)
		socket.emit('active')
    })		
	
	// Set finished modus
	$("#buttonFinished").click(function() {
		state.modus = "finished"
		socket.emit('updateStatus', state)
		socket.emit('finished')
    })
	
	// Set results modus
	$("#buttonResults").click(function() {
		state.modus = "results"
		socket.emit('updateStatus', state)
		socket.emit('results')
    })	
	
	// Update question
	$("#updateQuestion").click(function() {
		updateCurrentQuestion()
		socket.emit('updateStatus', state)
		socket.emit('updateQuestion')
	})
	
	//
	$("#newQuestion").click(function() {
		updateCurrentQuestion()
		socket.emit('updateStatus', state)
		socket.emit('newQuestion')
	})
	
	// Move to
	$("#moveSelected").click(function() {
		socket.emit('moveTo', (parseInt($('#moveTo').val()) - 1))
	})
	
	$('#moveTo').on('keypress',function(e) {
		if(e.which == 13) {
			socket.emit('moveTo', (parseInt($('#moveTo').val()) - 1))
		}
	})
	
	$('#moveTo').on('change',function(e) {
		socket.emit('moveTo', (parseInt($('#moveTo').val()) - 1))
	})
	
	// Next question
	$("#nextQuestion").click(function() {
		socket.emit('nextQuestion')
	})
	
	// Previous question
	$("#previousQuestion").click(function() {
		socket.emit('previousQuestion')
	})
});

// Update current Question in memory
function updateCurrentQuestion() {
	state.currentQuestion.round = $("#round").val()
	state.currentQuestion.category = $("#category").val()
	state.currentQuestion.questionMode = $("#questionmode").val()
	state.currentQuestion.question = $("#question").val()
	state.currentQuestion.answers = [$("#answerBlue").val(), $("#answerOrange").val(), $("#answerGreen").val(), $("#answerYellow").val()]	
	state.currentQuestion.solution = colorCode.indexOf($("input[name='questionanswer']:checked").val())
	let solutionOrder = $("#solutionOrder0").val() + '-' + $("#solutionOrder1").val() + '-' + $("#solutionOrder2").val() + '-' + $("#solutionOrder3").val()
	state.currentQuestion.solutionOrder = solutionOrder
	state.currentQuestion.solutionBuzzer = $("#solutionBuzzer").val()
	state.currentQuestion.score = parseInt($("#questionscore").val())
	state.currentQuestion.scoreMinus = parseInt($("#scoreMinus").val())
	var ArrayData = $.map($("#scoreArray").val().split(','), function(value){
		return parseInt(value, 10);
		// or return +value; which handles float values as well
	})
	state.currentQuestion.scoreArray = ArrayData
	state.currentQuestion.remarks = $("#remarks").val()
}

// Initialize the dashboard page
function setupPage() {
	$('#questionmode').change(function() {
		deactivateMenuChoices()
	})
	$("#solutionOrder0").change(function(){
		$(this).css("background-color", $(this).val());
	});
	$("#solutionOrder1").change(function(){
		$(this).css("background-color", $(this).val());
	});
	$("#solutionOrder2").change(function(){
		$(this).css("background-color", $(this).val());
	});
	$("#solutionOrder3").change(function(){
		$(this).css("background-color", $(this).val());
	});
	for(i = 0; i < state.numberOfPlayers; i++) {
		$("#panels").append('<div id="player_' + i + '" class="player"></div>')
		
		// Name of the player
		$("#player_" + i).append('<input type="text" id="name_' + i + '" class="playerName" name="' + i + '"/>')
		$("#name_" + i).bind("keyup", function(){
			var value = $(this).val()
			var name = $(this).attr('name')
			socket.emit('name', {player: name, value: value})
		})
		
		// Total score
		$("#player_" + i).append('<input type="number" id="score_' + i + '" class="playerScore" name="' + i + '"/>')
		$("#score_" + i).change(function(){
			state.scores[$(this).attr('name')] = $(this).val()
			socket.emit('updateStatus', state)
		})
		
		// Points gained at last question (before addition to total score) aka Delta
		$("#player_" + i).append('<input type="number" id="delta_' + i + '" class="playerScore" name="' + i + '"/>')
		$("#delta_" + i).change(function(){
			state.scoresDelta[$(this).attr('name')] = $(this).val()
			socket.emit('updateStatus', state)
		})
		
		// Selected button	
		$("#player_" + i).append('<div id="keuze_' + i + '"></div>')
		
		// Rank (in case of timed question)
		$("#player_" + i).append('<div id="rank_' + i + '"></div>')
		
		// Question correct or not?
		$("#player_" + i).append('<input type="checkbox" id="correct_' + i + '" name="' + i + '"/>')
		$("#player_" + i).append('<label for="correct_' + i + '">correct</label><br/>')
		$("#correct_" + i).change(function(){
			var name = $(this).attr('name')
			state.correct[name] = this.checked;
			socket.emit('updateStatus', state);
		})

		// Light switch for red button
		$("#player_" + i).append('<button id="button_' + i + '" type="button" value="' + i + '">Light</button>')
		$("#button_" + i).click(function(){
			var value = $(this).val()
			socket.emit('light', {number : value})
		})
	}
	socket.emit('getQuestions')
	pageLoaded = true
	refreshPage()
}

// Select question in list
function selectQuestion(index) {
	$('.question:nth-child(even)').css("background-color", "#81DAF5")
	$('.question:nth-child(odd)').css("background-color", "#81BEF7")
	$('#question_' + index).css('background-color', 'green')
}

// (De)activate menu choices depending om selected mode
function deactivateMenuChoices() {
	switch($("#questionmode").val()) {
		case "multiple":
		case "multifirst":
		case "multisteal":
			$('.radio').show()
			$('#solutionOrderWrapper').hide()
			$('#solutionBuzzerWrapper').hide()
			$('#solutionMultiWrapper').show()			
			break
		case "inorder":
			$('.radio').hide()
			$('#solutionBuzzerWrapper').hide()
			$('#solutionOrderWrapper').show()
			$('#solutionMultiWrapper').show()			
			break
		case "buzzer":
			$('#solutionOrderWrapper').hide()
			$('#solutionMultiWrapper').hide()
			$('#solutionBuzzerWrapper').show()			
			break
		default:
			$('#solutionMultiWrapper').show()
			$('#solutionOrderWrapper').show()
			$('#solutionBuzzerWrapper').show()	
	}
}

// Set control flow modus
function setModus() {
	switch(state.modus) {
		case "waiting":
			$('#buttonWaiting').css('background-color', 'green')
			$('#buttonWaiting').css('color', 'white')
			$('#buttonReady').css('background-color', 'lightgray')
			$('#buttonReady').css('color', 'black')
			$('#buttonActive').css('background-color', 'lightgray')
			$('#buttonActive').css('color', 'black')
			$('#buttonFinished').css('background-color', 'lightgray')
			$('#buttonFinished').css('color', 'black')
			$('#buttonResults').css('background-color', 'lightgray')
			$('#buttonResults').css('color', 'black')
			break
		case "ready":
			$('#buttonWaiting').css('background-color', 'green')
			$('#buttonWaiting').css('color', 'white')
			$('#buttonReady').css('background-color', 'green')
			$('#buttonReady').css('color', 'white')
			$('#buttonActive').css('background-color', 'lightgray')
			$('#buttonActive').css('color', 'black')
			$('#buttonFinished').css('background-color', 'lightgray')
			$('#buttonFinished').css('color', 'black')
			$('#buttonResults').css('background-color', 'lightgray')
			$('#buttonResults').css('color', 'black')
			break
		case "active":
			$('#buttonWaiting').css('background-color', 'green')
			$('#buttonWaiting').css('color', 'white')
			$('#buttonReady').css('background-color', 'green')
			$('#buttonReady').css('color', 'white')
			$('#buttonActive').css('background-color', 'green')
			$('#buttonActive').css('color', 'white')
			$('#buttonFinished').css('background-color', 'lightgray')
			$('#buttonFinished').css('color', 'black')
			$('#buttonResults').css('background-color', 'lightgray')
			$('#buttonResults').css('color', 'black')			
			break
		case "finished":
			$('#buttonWaiting').css('background-color', 'green')
			$('#buttonWaiting').css('color', 'white')
			$('#buttonReady').css('background-color', 'green')
			$('#buttonReady').css('color', 'white')
			$('#buttonActive').css('background-color', 'green')
			$('#buttonActive').css('color', 'white')
			$('#buttonFinished').css('background-color', 'green')
			$('#buttonFinished').css('color', 'white')
			$('#buttonResults').css('background-color', 'lightgray')
			$('#buttonResults').css('color', 'black')			
			break
		case "results":
			$('#buttonWaiting').css('background-color', 'green')
			$('#buttonWaiting').css('color', 'white')
			$('#buttonReady').css('background-color', 'green')
			$('#buttonReady').css('color', 'white')
			$('#buttonActive').css('background-color', 'green')
			$('#buttonActive').css('color', 'white')
			$('#buttonFinished').css('background-color', 'green')
			$('#buttonFinished').css('color', 'white')
			$('#buttonResults').css('background-color', 'green')
			$('#buttonResults').css('color', 'white')
			break
		default:
			$('#buttonWaiting').css('background-color', 'lightgray')
			$('#buttonReady').css('background-color', 'lightgray')
			$('#buttonActive').css('background-color', 'lightgray')
			$('#buttonFinished').css('background-color', 'lightgray')
			$('#buttonResults').css('background-color', 'lightgray')		
	}
}

// Refresh the dashboard page
function refreshPage() {

	// Control panel
	setModus()
	$("#flashing").prop("checked", state.flashing)
	
	// Current question panel
	$("input[id='id']").val(state.currentQuestion.id)
	if(state.title == "") {
		$("#title").val("Vraag " + (state.currentQuestion.id + 1))
	} else {
		$("#title").val(state.title)
	}
	$("#question").val(state.currentQuestion.question)
	$("#round").val(state.currentQuestion.round) 
	$("#category").val(state.currentQuestion.category) 
	$("#questionscore").val(state.currentQuestion.score)
	$("#scoreMinus").val(state.currentQuestion.scoreMinus)
	$("#scoreArray").val(state.currentQuestion.scoreArray)
	$("#questionmode").val(state.currentQuestion.questionMode)
	deactivateMenuChoices()
	$("#answerBlue").val(state.currentQuestion.answers[0])
	$("#answerOrange").val(state.currentQuestion.answers[1])
	$("#answerGreen").val(state.currentQuestion.answers[2])	
	$("#answerYellow").val(state.currentQuestion.answers[3])	
	$("input[name='questionanswer'][value='"+colorCode[state.currentQuestion.solution]+"']").prop('checked', true);
	let solutionOrder = state.currentQuestion.solutionOrder.split('-')
	$("#solutionOrder0").val(solutionOrder[0])
	$("#solutionOrder0").css("background-color", solutionOrder[0])
	$("#solutionOrder1").val(solutionOrder[1])
	$("#solutionOrder1").css("background-color", solutionOrder[1])
	$("#solutionOrder2").val(solutionOrder[2])
	$("#solutionOrder2").css("background-color", solutionOrder[2])
	$("#solutionOrder3").val(solutionOrder[3])
	$("#solutionOrder3").css("background-color", solutionOrder[3])
	$("#solutionBuzzer").val(state.currentQuestion.solutionBuzzer)
	$("#remarks").val(state.currentQuestion.remarks);

	if(state.modus == "active") {
		$("#addScores").hide()
	} else {
		// Check if there are any delta's registered
		let delta = false
		for(var i = 0; i < state.numberOfPlayers; i++) {
			if(parseInt(state.scoresDelta[i]) != 0) {
				delta = true
				break
			}
		}
		$("#addScores").toggle(delta)
	}
	for(i = 0; i < state.numberOfPlayers; i++) {
		if (state.selectedButtons[i] != "none") {
			$("#player_" + i).css({backgroundColor: state.selectedButtons[i]});
		} else {
			$("#player_" + i).css({backgroundColor: "white"});
		}
		$("#keuze_" +i ).html(state.selectedButtons[i])
		$("#correct_" +i ).prop("checked", state.correct[i])
		if (state.lightState[i]) {
			$("#button_" + i).css('background-color','#4CAF50') /* Green */
		} else {
			$("#button_" + i).css('background-color','#e7e7e7') /* Gray */
		}
		$("#score_"+i).val(state.scores[i])
		$("#delta_"+i).val(state.scoresDelta[i])
		$("#name_"+i).val(state.names[i])
		$("#rank_"+i).html(state.speedSequence[i])
	}
	selectQuestion(state.currentQuestion.id)
	
	// When question is active, prohibit scrolling through questions list
	$("#nextQuestion").prop("disabled", state.modus == "active")
	$("#previousQuestion").prop("disabled", state.modus == "active")
	$("#moveTo").prop("disabled", state.modus == "active")
}

socket.on('status', function(msg) {
	console.log(msg)
	state = msg
	if (!pageLoaded) {
		setupPage()
	} else {
		refreshPage()
	}
})

//Listen on new_message
socket.on("new_message", function(data) {
	$("#chatroom").prepend("<p class='message'>" + data.username + ": " + data.message + "</p>")
	console.log("#keuze_"+data.playerId)
})

socket.on('questions', function(questions) {
	let id = state.currentQuestion.id
	questionsList = questions
	for(let i = 0; i < questions.length; i++) {
		question = questions[i]
		if($('#question_' + i).length) {
			$('#question_' + i).html((i + 1) + ' - ' + question.question)
		} else {
			$('#questions').append('<p id="question_' + i + '" class="question" name="' + i + '">' + (i + 1) + ' - ' + question.question + '</p>')
			$('#question_' + i ).click(function() {
				if(state.modus == "waiting") {  // Avoid scrolling through questions while question is active
					let name = $(this).attr('name')
					selectQuestion(name)
					state.currentQuestion = questionsList[name]
					socket.emit('updateStatus', state)
				}
			})
		}
	}
	state.currentQuestion = questions[id]
	socket.emit('updateStatus', state)
	console.log("length", questionsList.length)
})