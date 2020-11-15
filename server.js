const express = require('express');
const http = require("http")
const app = express();
const server = http.createServer(app);

const socket = require("socket.io");
const io = socket(server);

const murmur = require("murmurhash-js"); 

app.use(express.json());

const mongoose = require('mongoose');

const mongoDB = 'mongodb+srv://Austin:Carter@cluster0.tw0ns.mongodb.net/TimeFace?retryWrites=true&w=majority';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const User = require("./schemas/user");



avaliableUsers = [];
usersInCall = [];

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

	socket.on('disconnect', () => { 
		console.log(`Disconnecting ${socket.id}`)
		avaliableUsers = avaliableUsers.filter((user) => user.socket != socket.id);
		usersInCall = usersInCall.filter((user) => user.socket != socket.id);
	});
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

	var bestFitScore = 0
	var bestMatch = avaliableUsers.find(user => user.socket != req.params.socket);
	if(!bestMatch) return res.status(404).json({ msg: " There are currently no users avalible! " });

	var self = avaliableUsers.find(user => user.socket == req.params.socket)
	if(!self) self = usersInCall.find(user => user.socket == req.params.socket)
	
	if(!self) return res.status(404).json({ msg: " Current user is not active! " });

	//Triple nested for loop! Spooky. Number of tags will relaly be around 10 at most so the inner two 
	// loops should be about 100 ops. Though a hash set in theory would have better big-O runtime, the constant associated with taking
	// a hash is too large to justify for a this numer of elements where the only ops happening is an increment and numeric equaity operation
	// set would end up being slower than a list
	for(user of avaliableUsers) {
		score = 0;
		for(tag of user.tags){
			for(myTag of self.tags){
				if(myTag == tag) {
					score++
					break;
				}
			}
		}

		if(user.socket != req.params.socket && score > bestFitScore) {
			bestMatch = user;
			bestFitScore = score;
		}
	}
	console.log(`matched with ${bestMatch.name} with a fitness score of ${bestFitScore}`)
	console.log(`${bestMatch.name}: ${bestMatch.socket}  ${bestMatch.tags}`)
	res.json(bestMatch)
});

app.post('/api/users', async (req, res) => {
	console.log(req.body);

	//check if the user exists before adding it 
	const exists = await User.exists({ name: req.body.name.toLowerCase() });
	if(exists)
		return res.status(409).json({ msg: "Username is already in use!" });

	var hashedTags = []
	// hash tags so can do integer comparisons instead of string comparisons (also we can call them hashed tags which is fun)
	const tagsList = req.body.tags;
	for(tag of tagsList) 
		hashedTags.push(murmur.murmur3(tag, HASHSEED))

	var newUser = {
		name: req.body.name,
		socket: req.body.socket,
		tags: hashedTags
	};

	if(!newUser.name || !newUser.socket) {
		return res.status(400).json({ msg: "User needs a name and socket" });
	}

	User.create({ name: newUser.name.toLowerCase(), tags: tagsList }, function (err, instance) {
		if (err) return console.log(err.code());
	});

	avaliableUsers.push(newUser);
	res.json(avaliableUsers);
});

app.get('/api/login/:name/:socket', (req, res) => {
	User.find()
		.where('name').equals(req.params.name.toLowerCase())
		.exec((err, users) => {
			if (err) console.log(err.code());
			if (users.length > 1) 
				console.warn(`[DBERROR]: multiple instances of ${users[0].name} in database`);
			if (users.length == 0) 
				return res.status(404).json({ msg: " User login does not exist! "});

			const hashedTags = users[0].tags.map((tag) => {
					return murmur.murmur3(tag, HASHSEED)
				});

			avaliableUsers.push({
				name: req.params.name, 
				socket: req.params.socket,
				tags: hashedTags
			});

			console.log(users[0])
			res.json(users[0]);
		})
});

const port = 5000;

server.listen(port, () => console.log(`Server started on port ${port}`));