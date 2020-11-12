const express = require('express');
const http = require("http")
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const murmur = require("murmurhash-js"); 

app.use(express.json());
app.use(express.urlencoded({extended: false}));

const avaliableUsers = [];
const usersInCall = [];

const HASHSEED = 0x32F1A902;

io.on('connection', socket => {
	console.log(`Connection from socket ${socket.id}`);


	socket.on("startCall", (data) => {
		console.log(`starting call ${socket.id} -> ${data.toCall}`)

		var index = 0;
		for(user of avaliableUsers) {
			if(user.socket == socket.id || user.socket == data.toCall) {
				console.log("Moving user from avaliable to in call");
				usersInCall.push(user);
				avaliableUsers.splice(index, 1);
			} 
			else
				index ++;
		}

        io.to(data.toCall).emit('incomingCall', {from: socket.id, offer: data.offer});
    })

	socket.on("answerCall", (data) => {
		console.log(`answering call ${socket.id} -> ${data.toCall}`)
        io.to(data.toCall).emit('callAnswered', {from: socket.id, answer: data.answer});
    })

	//exchange offer and answer from callee to caller now
    socket.on("returnCall", (data) => {
    	console.log(`returning call ${socket.id} -> ${data.toCall}`)
    	io.to(data.toCall).emit('callback', {from: socket.id});
    })

    socket.on("endCall", (data) => {
    	console.log(`${socket.id} ending call with ${data.toCall}`) 

    	var index = 0;
    	for(i = 0; i < usersInCall.length; i++) {
    		user = usersInCall[i];

    		console.log(`${user.socket} | ${socket.id} | ${data.toCall}`)

    		if(user.socket == socket.id || user.socket == data.toCall) {
    			console.log("User being moved to avaliable user pool");
    			avaliableUsers.push(user);
    			usersInCall.splice(i, 1);
    			i--;
    		}
    	}

    	io.to(data.toCall).emit('callEnded', {from: socket.id})

    })

    socket.on("nextCall", (data) => {
    	console.log(`${socket.id} changing from ${data.toEnd} -> ${data.toCall}`)

    	var index = 0;
		for(user of usersInCall) {
			if(user.socket == data.toEnd) {
				console.log("Moving user back to avaliable pool");
				avaliableUsers.push(user);
				usersInCall.splice(index, 1);
				break; // only have one item to remove
			} 
			else
				index ++;
		}

    	io.to(data.toEnd).emit('callEnded', {})
    	io.to(socket.id).emit('goNext', {toCall: data.toCall})
    })

	io.on('disconnect', () => { console.log(`Disconnecting ${socket.id}`) });
});

//debug endpoints
app.get('/api/users', (req, res) => {
	res.json(avaliableUsers);
});

app.get('/api/callers', (req, res) => {
	res.json(usersInCall);
});
 /////////////////////////

app.get('/api/match/:socket', (req, res) => {
	//TODO: handle the case where no match can be found
	var bestFitScore = 0
	var bestMatch = avaliableUsers[0]

	const self = avaliableUsers.filter(user => user.socket == req.params.socket)[0]
	//TODO: check that self is found
	console.log(`matching ${self.name}`)

	for(user of avaliableUsers) {
		score = 0;

		for(tag of user.tags){
			for(myTag of self.tags){
				if(myTag == tag)
					score++
			}
		}

		if(user.socket != req.params.socket && score > bestFitScore) {
			bestMatch = user;
			bestFitScore = score;
		}
	}
	console.log(`matched with ${bestMatch.name} with a fitness score of ${bestFitScore}`)
	return res.json(bestMatch)
});

app.post('/api/users', (req, res) => {
	//TODO: handle malformed request
	console.log(req.body);
	var hashedTags = []
	// hash tags so can do integer comparisons instead of string comparisons (also we can call them hashed tags which is fun)
	// when hashing want to change all letters to lowercase and remove extra spacing at ends so that we can get more consistant results
	for(tag of req.body.tags.split(',')) 
		hashedTags.push(murmur.murmur3(tag.toLowerCase().trim(), HASHSEED))

	var newUser = {
		name: req.body.name,
		socket: req.body.socket,
		tags: hashedTags
	};

	if(!newUser.name || !newUser.socket) {
		return res.status(400).json({ msg: "User needs a name and socket" });
	}

	avaliableUsers.push(newUser);
	res.json(avaliableUsers);
});

const port = 5000;

server.listen(port, () => console.log(`Server started on port ${port}`));