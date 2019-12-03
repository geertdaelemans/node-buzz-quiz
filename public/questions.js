var socket = io.connect('http://localhost:3000')

var pageLoaded = false

var videoPlaying = "none"
var imageBackground = "none"

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
	lightState: [],
	flashing: true,
	buzzerSounds: true
}

// Get the video
var video = document.getElementById("backgroundVideo");

const colorCode = ["blue", "orange", "green", "yellow"]

$(function(){
	socket.emit('getStatus')
	

})

// Initialize the scores page
function setupPage() {
	pageLoaded = true
	$('#backgroundVideo').hide()
	refreshPage()
}

// Get question mode for display
function getQuestionMode() {
	switch(state.currentQuestion.questionMode) {
		case "multiple":
			return "Multiple Choice"
		case "multifirst":
			if(state.currentQuestion.scoreArray[0] != null) {
				return "Multiple Choice<br/>Hoe sneller, hoe meer punten"
			} else {
				return "Multiple Choice<br/>De snelste wint"
			}
		case "multisteal":
			return "Multiple Choice<br/>De snelste steelt"
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
		$("#multipleResultsPanel").hide()
		$("#waitingPanel").show()			// Active
		break
	case "ready":
		$("#waitingPanel").hide()
		$("#singlePanel").hide()
		$("#multiplePanel").hide()
		$("#resultsPanel").hide()
		$("#multipleResultsPanel").hide()
		$("#readyPanel").show()				// Active
		break
	case "open":
		$("#waitingPanel").hide()
		$("#readyPanel").hide()
		$("#multiplePanel").hide()
		$("#resultsPanel").hide()
		$("#multipleResultsPanel").hide()
		$("#singlePanel").show()			// Active
		break
	case "multiple":
		$("#waitingPanel").hide()
		$("#readyPanel").hide()
		$("#singlePanel").hide()
		$("#resultsPanel").hide()
		$("#multipleResultsPanel").hide()
		$("#multiplePanel").show()			// Active
		break
	case "answer":
		$("#waitingPanel").hide()
		$("#readyPanel").hide()
		$("#singlePanel").hide()
		$("#multiplePanel").hide()
		$("#multipleResultsPanel").hide()
		$("#resultsPanel").show()			// Active
		break
	case "multianswer":
		$("#waitingPanel").hide()
		$("#readyPanel").hide()
		$("#singlePanel").hide()		
		$("#multiplePanel").hide()
		$("#resultsPanel").hide()
		$("#multipleResultsPanel").show()	// Active
		break
	default:
		$("#readyPanel").hide()
		$("#singlePanel").hide()		
		$("#multiplePanel").hide()
		$("#resultsPanel").hide()
		$("#multipleResultsPanel").hide()
		$("#waitingPanel").show()			// Active
	}
}

function getImageInfo(string) {
	const regExp = /\[([^)]+)\]/;
	let matches = string.match(regExp)
	if(matches != null) {
		let imageArray = matches[1].split(':')
		if(imageArray[0] == "img") {
			return 'media/' + imageArray[1]
		} else {
			return null
		} 
	} else {
		return null
	}
}

function stripImageTags(string) {
	return string.replace(/ *\[[^)]*\] */g, "")
}

// Refresh the questions page
function refreshPage() {
	let modus = state.modus
	if(modus == "finished" && state.currentQuestion.questionMode == "multisteal") {
		modus = "results"
	}
	switch(modus) {
		case "waiting":
			activatePanel("waiting")
			break
		case "ready":
			$('#questionRound').html("Ronde: " + state.currentQuestion.round)
			$('#questionNumber').html("Vraag " + (parseInt(state.currentQuestion.id) + 1))			
			$('#questionMode').html(getQuestionMode())
			if(state.currentQuestion.questionMode == "multifirst" && state.currentQuestion.scoreArray[0] != 0) {
				$('#questionPlus').html("Win: " + state.currentQuestion.scoreArray[0] + " &#8594; " + state.currentQuestion.scoreArray[state.currentQuestion.scoreArray.length - 1] + " punten")
		    } else if(state.currentQuestion.questionMode == "multisteal") {
				$('#questionPlus').html("Win: 20% van de punten")
			} else {
				$('#questionPlus').html("Win: " + state.currentQuestion.score + " punten")
			}
			if(state.currentQuestion.questionMode == "multisteal") {
				$('#questionMinus').html("Verlies: 20% van de punten")
			} else {
				$('#questionMinus').html("Verlies: " + state.currentQuestion.scoreMinus + " punten")
			}
			activatePanel("ready")
			break
		case "active":
		case "finished":
			if(state.currentQuestion.questionMode == "buzzer") {
				activatePanel("open")
				
				// Question
				if(stripImageTags(state.currentQuestion.question).length > 0) {
					$("#questionSingle").html(stripImageTags(state.currentQuestion.question))
				} else {
					$("#questionSingle").html('')
				}
				let imageName = getImageInfo(state.currentQuestion.question)
				if(imageName) {
					$("#questionSingle").append('<img src="' + imageName + '" />')
				}
			} else {
				activatePanel("multiple")
				
				// Question
				if(stripImageTags(state.currentQuestion.question).length > 0) {
					$("#questionMultiple").html(stripImageTags(state.currentQuestion.question))
				} else {
					$("#questionMultiple").html('')
				}
				let imageName = getImageInfo(state.currentQuestion.question)
				if(imageName) {
					$("#questionMultiple").append('<img src="' + imageName + '" />')
				}
				
				// Blue answer
				if(stripImageTags(state.currentQuestion.answers[0]).length > 0) {
					$("#answerBlue").html('<div class="answer" style="width: 50%">' + stripImageTags(state.currentQuestion.answers[0]) + '</div>')
				} else {
					$("#answerBlue").html('')
				}
				imageName = getImageInfo(state.currentQuestion.answers[0])
				if(imageName) {
					$("#answerBlue").append('<img src="' + imageName + '" />')
				}
				
				// Orange answer
				$("#answerOrange").html(stripImageTags(state.currentQuestion.answers[1]))
				if(stripImageTags(state.currentQuestion.answers[1]).length > 0) {
					$("#answerOrange").html('<div class="answer" style="width: 50%">' + stripImageTags(state.currentQuestion.answers[1]) + '</div>')
				} else {
					$("#answerOrange").html('')
				}
				imageName = getImageInfo(state.currentQuestion.answers[1])
				if(imageName) {
					$("#answerOrange").append('<img src="' + imageName + '" />')
				}
				
				// Green answer
				$("#answerGreen").html(stripImageTags(state.currentQuestion.answers[2]))
				if(stripImageTags(state.currentQuestion.answers[2]).length > 0) {
					$("#answerGreen").html('<div class="answer" style="width: 50%">' + stripImageTags(state.currentQuestion.answers[2]) + '</div>')
				} else {
					$("#answerGreen").html('')
				}
				imageName = getImageInfo(state.currentQuestion.answers[2])
				if(imageName) {
					$("#answerGreen").append('<img src="' + imageName + '" />')
				}
				
				// Yellow answer
				$("#answerYellow").html(stripImageTags(state.currentQuestion.answers[3]))
				if(stripImageTags(state.currentQuestion.answers[3]).length > 0) {
					$("#answerYellow").html('<div class="answer" style="width: 50%">' + stripImageTags(state.currentQuestion.answers[3]) + '</div>')
				} else {
					$("#answerYellow").html('')
				}
				imageName = getImageInfo(state.currentQuestion.answers[3])
				if(imageName) {
					$("#answerYellow").append('<img src="' + imageName + '" />')
				}
			}
			break
		case "results":
			switch(state.currentQuestion.questionMode) {
				case "multiple":
				case "multifirst":
				case "multisteal":
					if(state.currentQuestion.solutionBuzzer) {
						if(stripImageTags(state.currentQuestion.solutionBuzzer).length > 0) {
							$("#answer").html('<div class="answerDuo">' + stripImageTags(state.currentQuestion.solutionBuzzer) + '</div>')
						} else {
							$("#answer").html('')
						}
						let imageName = getImageInfo(state.currentQuestion.solutionBuzzer)
						if(imageName) {
							$("#answer").append('<img src="' + imageName + '" />')
						}
					} else {
						$('#answer').html(state.currentQuestion.answers[state.currentQuestion.solution])
					}
					activatePanel("answer")
					break
				case "buzzer":
					if(stripImageTags(state.currentQuestion.solutionBuzzer).length > 0) {
						$("#answer").html(stripImageTags(state.currentQuestion.solutionBuzzer))
					} else {
						$("#answer").html('')
					}
					let imageName = getImageInfo(state.currentQuestion.solutionBuzzer)
					if(imageName) {
						$("#answer").append('<img src="' + imageName + '" />')
					}
					activatePanel("answer")
					break
				case "inorder":
					let solutionArray = state.currentQuestion.solutionOrder.split('-')
					for(let i = 0; i < solutionArray.length; i++) {
						let answerString = state.currentQuestion.answers[colorCode.indexOf(solutionArray[i])]
						let imageName = getImageInfo(answerString)
						if(imageName) {
							$('#answer' + i).html('<div>' + stripImageTags(answerString) + '</div><div><img src="' + imageName +'" /></div>')
						} else {
							$('#answer' + i).html(stripImageTags(answerString))
						}
						$('#answer' + i).attr("class", solutionArray[i] + " " + "answermulti")
					}
					activatePanel("multianswer")
					break
			}
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

// Receive background image
socket.on('showImg', function(msg) {
	let imageFile = "media/" + msg
	if(imageBackground != imageFile) {	
		$('body').css('background-image', 'url(' + imageFile + ')')
		imageBackground = imageFile
	} else {
		$('body').css('background-image', 'url("")')
		imageBackground = "none"
	}
})

// Receive background video
socket.on('showVideo', function(msg) {
	let videoFile = "media/" + msg
	if(videoPlaying != videoFile) {
		$('#backgroundVideo').attr('src', videoFile)
		$('#backgroundVideo').show()
		$("#backgroundVideo")[0].load();
		$("#backgroundVideo")[0].play();
		$("video").prop('muted', false);		
		videoPlaying = videoFile
	} else {
		$("#backgroundVideo")[0].pause()
		$('#backgroundVideo').hide()
		videoPlaying = "none"
	}
//	video.play()
/*	$('backgroundVideo').on('ended', function(){
		console.log("Video ended")
    	$('#backgroundVideo').hide()    

    });*/
})

// Receive background audio
socket.on('showAudio', function(msg) {
	let videoFile = "media/" + msg
	if(videoPlaying != videoFile) {
		$('#backgroundVideo').attr('src', videoFile)
		$('#backgroundVideo').hide()
		$("#backgroundVideo")[0].load();
		$("#backgroundVideo")[0].play();
		$("video").prop('muted', false);
		videoPlaying = videoFile
	} else {
		$("#backgroundVideo")[0].pause()
		$('#backgroundVideo').hide()
		videoPlaying = "none"
	}
})

