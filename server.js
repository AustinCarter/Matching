const express = require('express');
const http = require("http")
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

app.use(express.json());
app.use(express.urlencoded({extended: false}));

const avaliableUsers = [];
const usersInCall = [];

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
	for(user of avaliableUsers) {
		if(user.socket != req.params.socket)
			return res.json(user)
	}
	res.status(400).json({ msg: "No avaliable users found"});
});

app.post('/api/users', (req, res) => {
	console.log(req.body);
	var newUser = {
		name: req.body.name,
		socket: req.body.socket
	};

	if(!newUser.name || !newUser.socket) {
		return res.status(400).json({ msg: "User needs a name and socket" });
	}

	avaliableUsers.push(newUser);
	res.json(avaliableUsers);
});

const port = 5000;

server.listen(port, () => console.log(`Server started on port ${port}`));