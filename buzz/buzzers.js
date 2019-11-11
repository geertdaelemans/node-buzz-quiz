const HID = require("node-hid");
const os = require("os")
const util = require('util')
const EventEmitter = require("events")

/*
    Howdy!
    
    Welcome to node-buzz, a Node.js library for controlling the USB controllers for the Playstation 2 quiz game 'Buzz!'
    The Playstation 3 version might work but I haven't tested it.

    Terminology used:
        Buzz Device - One Buzz device, thse have 4 Buzz controllers, and connect to the PC with one USB connector.
        Buzz Controller - These are the actual controller objects, that have 4 coloured answer buttons, 1 big red confirm button, and an LED inside the big red button.
*/

function findBuzzDevices() {
	var devices = HID.devices()
	var buzz = []
	var counter = 0;
	for (var i in devices) {
		if ((devices[i].vendorId == 1356 && devices[i].productId == 4096) ||
			(devices[i].vendorId == 1356 && devices[i].productId == 2)) {
			counter++;
			util.log("Buzzer", counter, "found!")
			buzz.push(devices[i].path)
		}
	}
	return buzz
}

function bufferToBString(array) {
    var bitsPerByte = 8, string = ""
	function repeat(r,t) {
		if(0 === r.length || t <= 1)
			return 1 === t ? r : ""
		for(var e="", n = r; t > 0;)
			1&t&&(e+=n),t>>=1,n+=n
		return e
		}
	function lpad(r,t,e){
		return repeat(t,e-r.length)+r
		}
	Array.prototype.forEach.call(array, function(r){string+=lpad(r.toString(2),"0",bitsPerByte)})
	return string
}

function bStringToArray(bstring) {
    var s = bstring.split("")
	var array = []
	for (var c of s) {
		array.push(c == "1")
	}
	return array
}

class BuzzController  {
    constructor(id,hid) {
        this.id = id
        this.hid = hid
        this.blue = false
		this.orange = false
		this.green = false
		this.yellow = false
		this.red = false
    }
    _handleButtonPress(event) {
        var controller = event[this.id]
        for (btn in controller) { 
			this[btn] = event[btn]
		}
    }
}

class BuzzDevice extends EventEmitter {
    /*
        Construct a 'Buzz' device object. One 'Buzz' controller object corresponds to one physical 'Buzz' device, which contains 4 'Buzz' controllers.

    */
    constructor() {
        super()
		this.device = {}
		this.lastEvent = {}
		var devices = findBuzzDevices()
		this.numberOfDevices = devices.length
		if (this.numberOfDevices > 0) {
			for (var i in devices) {
				this.device[i] = new HID.HID(devices[i])
				this.lastEvent[i] = [{blue: false,orange: false,green: false,yellow: false,red: false,},{blue: false,orange: false,green: false,yellow: false,red: false},{blue: false,orange: false,green: false,yellow: false,red: false},{blue: false,orange: false,green: false,yellow: false,red: false}]
			}
		} 		
        var obj = this
		var b = 12
		if (this.numberOfDevices >= 1) {
			this.device[0].on("data",function(buffer) {
				obj.handleButtonPress(buffer, 0)
			})
		}
		if (this.numberOfDevices >= 2) {
			this.device[1].on("data",function(buffer) {
				obj.handleButtonPress(buffer, 1)
			})
		}
    }
	
	getNumberOfControllers() {
		return 4 * this.numberOfDevices
	}
	
    handleButtonPress(buffer, controller) {
        var array = bStringToArray(bufferToBString(buffer))
        var controllerState = [
            {
                blue: array[19],
                orange: array[20],
                green: array[21],
                yellow: array[22],
                red: array[23],
            },
            {
                blue: array[30],
                orange: array[31],
                green: array[16],
                yellow: array[17],
                red: array[18]
            },
            {
                blue: array[25],
                orange: array[26],
                green: array[27],
                yellow: array[28],
                red: array[29]
            },
            {
                blue: array[36],
                orange: array[37],
                green: array[38],
                yellow: array[39],
                red: array[24]
            }
        ]
        for (var i in controllerState) {
            for (var x in controllerState[i]) {
                if (controllerState[i][x] != this.lastEvent[controller][i][x]) {
					var controllerId = parseInt(i) + 4 * parseInt(controller);
                    if (controllerState[i][x] == true) {
                        this.emit("buttondown",{
                            controllerId: controllerId,
                            controller: controllerState[i],
                            button: x,
                        })
                    } else {
                        this.emit("buttonup",{
                            controllerId: controllerId,
                            controller: controllerState[i],
                            button: x,
                        })
                    }
                }
            }
        }
        this.lastEvent[controller] = controllerState
    }
	
    light(lightState) {
		for (i = 0; i < this.numberOfDevices; i++) {
			this.device[i].write([0,0,
				lightState[0 + i * 4] ? 255 : 0,
				lightState[1 + i * 4] ? 255 : 0,
				lightState[2 + i * 4] ? 255 : 0,
				lightState[3 + i * 4] ? 255 : 0,
			0,0])
		}
    }
}
module.exports = BuzzDevice