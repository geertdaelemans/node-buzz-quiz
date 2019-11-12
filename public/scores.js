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

$(function(){
	socket.emit('getStatus')	
});

// Display status icon
function displayStatus(player, status = "none") {
	$("#score_"+i).hide()
	$("#delta_"+i).hide()
	$("#rank_"+i).hide()
	switch(status) {
		case "ok":
			$("#wait_" + i).hide()
			$("#correct_" + i).hide()
			$("#wrong_" + i).hide()
			$("#neutral_" + i).hide()
			$("#ok_" + i).show()			
			break
		case "waiting":
			$("#ok_" + i).hide()
			$("#correct_" + i).hide()
			$("#wrong_" + i).hide()
			$("#neutral_" + i).hide()
			$("#wait_" + i).show()			
			break
		case "correct":
			$("#wait_" + i).hide()
			$("#ok_" + i).hide()
			$("#wrong_" + i).hide()
			$("#neutral_" + i).hide()
			$("#correct_" + i).show()
			break
		case "wrong":	
			$("#wait_" + i).hide()
			$("#ok_" + i).hide()
			$("#correct_" + i).hide()
			$("#neutral_" + i).hide()
			$("#wrong_" + i).show()
			break
		case "neutral":
			$("#neutral_" + i).show()
			$("#wait_" + i).hide()
			$("#ok_" + i).hide()
			$("#correct_" + i).hide()
			$("#wrong_" + i).hide()
			break
		default:
			$("#wait_" + i).hide()
			$("#ok_" + i).hide()
			$("#correct_" + i).hide()
			$("#wrong_" + i).hide()
			$("#neutral_" + i).hide()			
	}
}

// Initialize the scores page
function setupPage() {
	for(i = 0; i < state.numberOfPlayers; i++) {
		$("#panels").append('<div id="player_' + i + '" class="player"></div>')
		
		// Player name
		$("#player_"+i).append('<div id="name_' + i + '" class="playerName"></div>')
		
		// Scores
		$("#player_"+i).append('<div class="scoreWrapper"><div id="score_' + i + '" class="score"></div><div id="delta_' + i + '" class="scoreDelta"></div></div>')
		$("#score_"+i).hide()
		$("#delta_"+i).hide()
		
		// Ranking
		$("#player_"+i).append('<div id="ranking_' + i + '" class="playerField"></div>')
		$("#ranking_"+i).hide()
		
		// Status image
		$("#player_"+i).append('<div id="status_' + i + '" class="statusWrapper"><div id="wait_' + i + '" class="playerField"><img src="img/waiting.png" width="200" height="200" /></div><div id="ok_' + i + '" class="playerField"><img src="img/star.png" width="200" height="200" /></div><div id="correct_' + i + '" class="playerField"><img src="img/correct.png" width="200" height="200" /></div><div id="wrong_' + i + '" class="playerField"><img src="img/wrong.png" width="200" height="200" /></div><div id="neutral_' + i + '" class="playerField"><img src="img/neutral.png" width="200" height="200" /></div></div>')
		$("#wait_"+i).hide()
		$("#ok_"+i).hide()
		$("#correct_"+i).hide()
		$("#wrong_"+i).hide()
		$("#neutral_"+i).hide()
	}
	$("#panels").append('<div class="counter" id="counter"></div>')
	pageLoaded = true
	refreshPage()
}

// Refresh the scores page
function refreshPage() {
	switch(state.questionMode) {
		case "scoreboard":
			$("#counter").html("Videotechnologie<br/>QUIZ")
			$(".scoreWrapper").show()
			break
		case "multiple":
			$("#counter").html("<h1>" + state.title + "<br/>Multiple<br/>Choice</h1>")
			$(".scoreWrapper").hide()
			break
		case "multifirst":
			$("#counter").html("<h1>" + state.title + "<br/>Multiple Snelste<br/>Choice</h1>")
			$(".scoreWrapper").hide()
			break
		case "buzzer":
			$("#counter").html("<h1>" + state.title + "<br/>Buzzer</h1>")
			$(".scoreWrapper").hide()
			break
		default:
			$("#counter").html("Videotechnologie<br/>QUIZ")
	}
	for(i = 0; i < state.numberOfPlayers; i++) {
		$("#name_"+i).html(state.names[i])
		switch (state.questionMode) {
			case "scoreboard":
				displayStatus(i)
				$("#status_"+i).css({backgroundColor: "white"})
				$("#ranking_" + i).hide()
				$("#score_"+i).html(state.scores[i])
				$("#score_"+i).show()
				if(state.scoresDelta[i] != 0) {
					$("#score_"+i).css("width", "50%")
					var sign = (parseInt(state.scoresDelta[i]) < 0 ? "" : "+")
					$("#delta_"+i).html(sign + state.scoresDelta[i])
					if(sign == "+") {
						$("#delta_"+i).css("color", "green")
					} else {
						$("#delta_"+i).css("color", "red")
					}
					$("#delta_"+i).show()
				} else {
					$("#score_"+i).css("width", "100%")
					$("#delta_"+i).hide()
				}
				break
			case "multiple":
			case "multifirst":
				if(state.questionActive) {
					$("#status_"+i).css({backgroundColor: "white"})
					if (state.selectedButtons[i] != "none") {
						displayStatus(i, "ok")
					} else {
						displayStatus(i, "waiting")					
					}
				} else {
					if (state.selectedButtons[i] != "none") {
						$("#status_"+i).css({backgroundColor: state.selectedButtons[i]})
					} else {
						$("#status_"+i).css({backgroundColor: "white"})
					}
					if(state.selectedButtons[i] == "none") {
						displayStatus(i, "neutral")
					} else {
						displayStatus(i, (state.correct[i] ? "correct" : "wrong"))
					}
				}
				break
			case "buzzer":
				if(state.questionActive) {
					$("#status_"+i).css({backgroundColor: "white"})
					if(state.speedSequence[i] == 0) {
						$("#ranking_"+i).css({backgroundColor: "white"})
						$("#ranking_" + i).hide()
						displayStatus(i, "waiting")
					} else {
						$("#ranking_" + i).css({backgroundColor: "red"})
						$("#ranking_" + i).html(state.speedSequence[i])
						displayStatus(i)
						$("#ranking_" + i).show()
					}
				} else {
					$("#ranking_" + i).hide()
					displayStatus(i)
					if(parseInt(state.scoresDelta[i]) > 0) {
						displayStatus(i, "correct")
					} else if(parseInt(state.scoresDelta[i]) < 0) {
						displayStatus(i, "wrong")
					} else {
						displayStatus(i, "neutral")
					}
				}
				break
		}
	}
}

socket.on('status', function(msg) {
	console.log(msg)
	state = msg
	if (!pageLoaded) {
		setupPage()
		pageLoaded = true;
	} else {
		refreshPage()
	}
});
