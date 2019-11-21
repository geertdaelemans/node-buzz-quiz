var socket = io.connect('http://localhost:3000')

var pageLoaded = false
var flash = 0;

var audio = []
audio[0] = new Audio('./wav/buzz1.wav')
audio[1] = new Audio('./wav/buzz2.wav')
audio[2] = new Audio('./wav/buzz3.wav')
audio[3] = new Audio('./wav/buzz4.wav')
audio[4] = new Audio('./wav/buzz5.wav')
audio[5] = new Audio('./wav/buzz6.wav')
audio[6] = new Audio('./wav/buzz7.wav')
audio[7] = new Audio('./wav/buzz8.wav')
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
	questionMode: "scoreboard",
	lightState: [],
	flashing: true,
	buzzerSounds: true
}

$(function(){
	socket.emit('getStatus')
	socket.emit('getAudioFiles')	
});

// Display status icon
function displayStatus(player, status = "none") {
	$("#score_"+player).hide()
	$("#delta_"+player).hide()
	$("#rank_"+player).hide()
	switch(status) {
		case "ok":
			$("#wait_" + player).hide()
			$("#correct_" + player).hide()
			$("#wrong_" + player).hide()
			$("#neutral_" + player).hide()
			$("#ok_" + player).show()			
			break
		case "waiting":
			$("#ok_" + player).hide()
			$("#correct_" + player).hide()
			$("#wrong_" + player).hide()
			$("#neutral_" + player).hide()
			$("#wait_" + player).show()			
			break
		case "correct":
			$("#wait_" + player).hide()
			$("#ok_" + player).hide()
			$("#wrong_" + player).hide()
			$("#neutral_" + player).hide()
			$("#correct_" + player).show()
			break
		case "wrong":	
			$("#wait_" + player).hide()
			$("#ok_" + player).hide()
			$("#correct_" + player).hide()
			$("#neutral_" + player).hide()
			$("#wrong_" + player).show()
			break
		case "neutral":
			$("#neutral_" + player).show()
			$("#wait_" + player).hide()
			$("#ok_" + player).hide()
			$("#correct_" + player).hide()
			$("#wrong_" + player).hide()
			break
		default:
			$("#wait_" + player).hide()
			$("#ok_" + player).hide()
			$("#correct_" + player).hide()
			$("#wrong_" + player).hide()
			$("#neutral_" + player).hide()			
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

function setupPanels(mode) {
	if(state.modus != 'active') {
		$("#counter").html('')
	}
	switch(mode) {
		case "scoreboard":
			$(".orderWrapper").hide()
			$(".scoreWrapper").show()
			resetOrderButtons()
			break
		case "multiple":
			$(".scoreWrapper").hide()
			$(".orderWrapper").hide()
			resetOrderButtons()
			break
		case "multifirst":
			$(".scoreWrapper").hide()
			$(".orderWrapper").hide()
			resetOrderButtons()
			break
		case "multisteal":
			$(".scoreWrapper").hide()
			$(".orderWrapper").hide()
			resetOrderButtons()
			break
		case "buzzer":
			$(".scoreWrapper").hide()
			$(".orderWrapper").hide()
			resetOrderButtons()
			break
		case "inorder":
			$(".scoreWrapper").hide()
			if(state.modus == "results") {
				$(".orderWrapper").hide()
			} else {
				$(".orderWrapper").show()
			}
			resetOrderButtons()
			break
		default:
			$(".orderWrapper").hide()
			resetOrderButtons()
	}
}

function fillPlayerGrid(mode) {
	for(i = 0; i < state.numberOfPlayers; i++) {
		$("#name_"+i).html(state.names[i])
		switch (mode) {
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
				switch(state.modus) {
					case "active":
						$("#status_"+i).css({backgroundColor: "white"})
						if (state.selectedButtons[i] != "none") {
							displayStatus(i, "ok")
						} else {
							displayStatus(i, "waiting")					
						}
						break
					case "finished":
						if (state.selectedButtons[i] != "none") {
							$("#status_"+i).css({backgroundColor: state.selectedButtons[i]})
							displayStatus(i)
						} else {
							$("#status_"+i).css({backgroundColor: "white"})
							displayStatus(i, "neutral")
						}
						break						
					case "results":
						if(state.selectedButtons[i] == "none") {
							displayStatus(i)
						} else {
							displayStatus(i, (state.correct[i] ? "correct" : "wrong"))
						}
						break
					default:
						$("#status_"+i).css({backgroundColor: "white"})
						displayStatus(i)						
				}
				break
			case "multifirst":
				switch(state.modus) {
					case "active":
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
						break
					case "finished":
						if(state.currentQuestion.scoreArray[0] != null) {
							if(state.selectedButtons[i] == "none") {
								displayStatus(i, "neutral")
							} else {
								$("#ranking_" + i).css({backgroundColor: state.selectedButtons[i]})
								$("#ranking_" + i).html(state.speedSequence[i])
								displayStatus(i)
								$("#ranking_" + i).show()
							}
						} else {
							if(state.selectedButtons[i] != "none") {
								displayStatus(i, "ok")
							} else {
								displayStatus(i)
							}
						}
						break
					case "results":
						$("#ranking_" + i).hide()
						if (state.selectedButtons[i] != "none") {
							$("#status_"+i).css({backgroundColor: state.selectedButtons[i]})
						} else {
							$("#status_"+i).css({backgroundColor: "white"})
						}
						if(state.selectedButtons[i] == "none") {
							displayStatus(i)
						} else {
							displayStatus(i, (state.correct[i] ? "correct" : "wrong"))
						}
						break
					default:
						$("#status_"+i).css({backgroundColor: "white"})
						displayStatus(i)
				}
				break
			case "multisteal":
				switch(state.modus) {
					case "active":
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
						break
					case "finished":
						if(state.selectedButtons[i] == "none") {
							$("#status_"+i).css({backgroundColor: "white"})
							displayStatus(i, "neutral")
						} else {
							$("#status_"+i).css({backgroundColor: state.selectedButtons[i]})
							displayStatus(i, (state.correct[i] ? "correct" : "wrong"))
						}
						break
					case "results":
						$("#status_"+i).css({backgroundColor: "white"})
						if(parseInt(state.scoresDelta[i]) > 0) {
							displayStatus(i, "correct")
						} else if(parseInt(state.scoresDelta[i]) < 0) {
							displayStatus(i, "wrong")
						} else {
							displayStatus(i)
						}
						break
					default:
						$("#status_"+i).css({backgroundColor: "white"})
						displayStatus(i)
				}
				break
			case "buzzer":
				switch(state.modus) {
					case "active":
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
						break
					case "finished":
						if(state.speedSequence[i] == 0) {
							$("#ranking_"+i).css({backgroundColor: "white"})
							$("#ranking_" + i).hide()
							displayStatus(i, "neutral")
						} else {
							$("#ranking_" + i).css({backgroundColor: "red"})
							$("#ranking_" + i).html(state.speedSequence[i])
							displayStatus(i)
							$("#ranking_" + i).show()
						}
						break
					case "results":
						$("#ranking_" + i).hide()
						displayStatus(i)
						if(parseInt(state.scoresDelta[i]) > 0) {
							displayStatus(i, "correct")
						} else if(parseInt(state.scoresDelta[i]) < 0) {
							displayStatus(i, "wrong")
						} else {
							displayStatus(i)
						}
						break
					default:
						$("#status_"+i).css({backgroundColor: "white"})
						displayStatus(i)						
				}
				break
			case "inorder":
				switch(state.modus) {
					case "active":
						$("#status_" + i).css({backgroundColor: "white"})
						if(state.selectedButtons[i] != "none") {
							let array = state.selectedButtons[i].split('-')
							for(let j = 0; j < array.length; j++) {
								$("#order" + j + "_" + i).css("background-color", "red")
							}
						}
						break
					case "finished":
						let array = state.selectedButtons[i].split('-')
						for(let j = 0; j < array.length; j++) {
							$("#order" + j + "_" + i).css("background-color", array[j])
						}
						$("#status_" + i).css({backgroundColor: "white"})
						$("#ranking_" + i).hide()
						displayStatus(i)
						break
					case "results":
						if(parseInt(state.scoresDelta[i]) > 0) {
							displayStatus(i, "correct")
						} else if(!state.correct[i] && state.selectedButtons[i].length == 24 ) {
							displayStatus(i, "wrong")
						} else {
							displayStatus(i, "neutral")
						}
						break
					default:
						$("#status_"+i).css({backgroundColor: "white"})
						displayStatus(i)
				}
				break
		}
	}
}

// Refresh the scores page
function refreshPage() {
	switch(state.modus) {
		case "waiting":
			setupPanels("scoreboard")
			fillPlayerGrid("scoreboard")
			break
		case "ready":
			setupPanels(state.questionMode)
			fillPlayerGrid(state.questionMode)
			break
		default:
			setupPanels(state.questionMode)
			fillPlayerGrid(state.questionMode)
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

// Receive flashing status
socket.on('flash', function(msg) {
	displayStatus(msg, "ok")
	displayStatus(flash)
	flash = msg
})

// Receive clock ticks
socket.on('clock', function(msg) {
	$("#counter").css('font-size', 120)
	if(msg < 3) {
		$("#counter").css('color', 'red')
	}
	$("#counter").html(msg)
})