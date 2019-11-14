var socket = io.connect('http://localhost:3000')

var pageLoaded = false

var audio = []
audio[0] = new Audio('./wav/alarm.wav');
audio[1] = new Audio('./wav/crinkle.wav')
audio[2] = new Audio('./wav/ding.wav')
audio[3] = new Audio('./wav/flush.wav')
audio[4] = new Audio('./wav/intro.wav')
for(let i = 0; i < audio.length; i++) {
	audio[i].autoplay = true
}


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
	socket.emit('getAudioFiles')	
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
		
		// Order
		$("#player_"+i).append('<div class="orderWrapper"><div id="order0_' + i + '" class="order"></div><div id="order1_' + i + '" class="order"></div><div id="order2_' + i + '" class="order"> </div><div id="order3_' + i + '" class="order"> </div></div>')
		
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

function resetOrderButtons() {
	for(let i = 0; i < state.numberOfPlayers; i++) {
		if(state.selectedButtons[i] == "none") {
			for(let j = 0; j < 4; j++) {
				$("#order" + j + "_" + i).css("background-color", "white")
			}
		}
	}
}

// Refresh the scores page
function refreshPage() {
	switch(state.questionMode) {
		case "scoreboard":
			$("#counter").html("Videotechnologie<br/>QUIZ")
			$(".orderWrapper").hide()
			$(".scoreWrapper").show()
			resetOrderButtons()
			break
		case "multiple":
			$("#counter").html("<h1>" + state.title + "<br/>Multiple Choice</h1>")
			$(".scoreWrapper").hide()
			$(".orderWrapper").hide()
			resetOrderButtons()
			break
		case "multifirst":
			$("#counter").html("<h1>" + state.title + "<br/>Snelste<br/>Multiple Choice</h1>")
			$(".scoreWrapper").hide()
			$(".orderWrapper").hide()
			resetOrderButtons()
			break
		case "buzzer":
			$("#counter").html("<h1>" + state.title + "<br/>Buzzer</h1>")
			$(".scoreWrapper").hide()
			$(".orderWrapper").hide()
			resetOrderButtons()
			break
		case "inorder":
			$("#counter").html("<h1>" + state.title + "<br/>In Volgorde</h1>")
			$(".scoreWrapper").hide()
			$(".orderWrapper").show()
			resetOrderButtons()
			break
		default:
			$("#counter").html("Videotechnologie<br/>QUIZ")
			$(".orderWrapper").hide()
			resetOrderButtons()
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
			case "multifirst":
				if(state.questionActive) {
					$("#status_"+i).css({backgroundColor: "white"})
					if (state.selectedButtons[i] != "none") {
						if(state.selectedButtons[i] == state.solution) {
							displayStatus(i, "correct")
						} else {
							displayStatus(i, "wrong")
						}
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
			case "inorder":
				if(state.questionActive) {
					if(state.selectedButtons[i] != "none") {
						let array = state.selectedButtons[i].split('-')
						for(let j = 0; j < array.length; j++) {
							$("#order" + j + "_" + i).css("background-color", "red")
						}
					}
					$("#status_" + i).css({backgroundColor: "white"})
				} else {
					let array = state.selectedButtons[i].split('-')
					for(let j = 0; j < array.length; j++) {
						$("#order" + j + "_" + i).css("background-color", array[j])
					}
					$("#status_" + i).css({backgroundColor: "white"})
					$("#ranking_" + i).hide()
					displayStatus(i)
/*					if(parseInt(state.scoresDelta[i]) > 0) {
						displayStatus(i, "correct")
					} else if(!state.correct[i] && state.selectedButtons[i].length == 24 ) {
						displayStatus(i, "wrong")
					} else {
						displayStatus(i, "neutral")
					}*/
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

socket.on('sound', function(msg) {
	let index = msg % audio.length
	console.log("index", index)
	audio[index].load()
	audio[index].play()
})

// Receive list of available audio files
socket.on('audioFiles', function(msg) {
	for(let i = 0; i < msg.length; i++) {
		console.log('./wav/' + msg[i])
//		audio[i] = new Audio('./wav/' + msg[i]);
//		audio[i].autoplay = true
//		audio[i].load()
	}	
//	console.log("Audio files", audio)
})