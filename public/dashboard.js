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

	// Display scoreboard
	$("#scoreboard").click(function() {
		state.questionMode = "scoreboard"
		state.flashing = true
		socket.emit('updateStatus', state)
	})
	
	// Change flashing mode
	$("#flashing").change(function() {
        state.flashing = this.checked
		socket.emit('updateStatus', state)
    });

	// Start question mode
	$("#buttonStart").click(function() {
		state.title = $("#title").val()
		state.currentQuestion.question = $("#question").val()
		state.questionMode = $("#questionmode").val()
		state.currentQuestion.questionMode = $("#questionmode").val()
		state.currentQuestion.solution = colorCode.indexOf($("input[name='questionanswer']:checked").val())
		state.currentQuestion.score = $("#questionscore").val()
		socket.emit('updateStatus', state)
		socket.emit('start')
    })
	
	// Update question
	$("#updateQuestion").click(function() {
		state.currentQuestion.question = $("#question").val()
		state.currentQuestion.round = $("#round").val()
		state.currentQuestion.category = $("#category").val()
		state.currentQuestion.questionMode = $("#questionmode").val()
		state.currentQuestion.answers = [$("#answerBlue").val(), $("#answerOrange").val(), $("#answerGreen").val(), $("#answerYellow").val()]
		state.currentQuestion.solution = colorCode.indexOf($("input[name='questionanswer']:checked").val())
		state.currentQuestion.score = $("#questionscore").val()
		state.currentQuestion.remarks = $("#remarks").val()
		socket.emit('updateStatus', state)
		socket.emit('updateQuestion')
	})
	
	//
	$("#newQuestion").click(function() {
		state.currentQuestion.question = $("#question").val()
		state.currentQuestion.round = $("#round").val()
		state.currentQuestion.category = $("#category").val()
		state.currentQuestion.questionMode = $("#questionmode").val()
		state.currentQuestion.answers = [$("#answerBlue").val(), $("#answerOrange").val(), $("#answerGreen").val(), $("#answerYellow").val()]
		state.currentQuestion.solution = colorCode.indexOf($("input[name='questionanswer']:checked").val())
		state.currentQuestion.score = $("#questionscore").val()
		state.currentQuestion.remarks = $("#remarks").val()
		socket.emit('updateStatus', state)
		socket.emit('newQuestion')
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

// Initialize the dashboard page
function setupPage() {
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

// Refresh the dashboard page
function refreshPage() {
	$("#flashing").prop("checked", state.flashing)
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
	$("#questionmode").val(state.currentQuestion.questionMode)
	$("#answerBlue").val(state.currentQuestion.answers[0])
	$("#answerOrange").val(state.currentQuestion.answers[1])
	$("#answerGreen").val(state.currentQuestion.answers[2])	
	$("#answerYellow").val(state.currentQuestion.answers[3])	
	$("input[name='questionanswer'][value='"+colorCode[state.currentQuestion.solution]+"']").prop('checked', true);	
	$("#remarks").val(state.currentQuestion.remarks);
	if(state.questionActive) {
		$("#scoreboard").hide()
		$("#addScores").hide()
	} else {
		$("#scoreboard").show()
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
	if(state.questionActive) {
		$("#buttonStart").html('Evalueer')
	} else {
		$("#buttonStart").html('Start')
	}
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
			$('#question_' + i).html(question.question)
		} else {
			$('#questions').append('<p id="question_' + i + '" class="question" name="' + i + '">' + (i + 1) + ' - ' + question.question + '</p>')
			$('#question_' + i ).click(function() {
				$('.question:nth-child(even)').css("background-color", "#81DAF5")
				$('.question:nth-child(odd)').css("background-color", "#81BEF7")
				$(this).css('background-color', 'green')
				let name = $(this).attr('name')
				state.currentQuestion = questions[name]
				socket.emit('updateStatus', state)
			})
		}
	}
	state.currentQuestion = questions[id]
	socket.emit('updateStatus', state)
	console.log("length", questionsList.length)
})