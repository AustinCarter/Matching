const express = require('express');
const http = require("http")
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

app.use(express.json());
app.use(express.urlencoded({extended: false}));

const users = [];

io.on('connection', socket => {
	console.log(`Connection from socket ${socket.id}`);


	socket.on("startCall", (data) => {
		console.log(`starting call ${socket.id} -> ${data.toCall}`)
        io.to(data.toCall).emit('incomingCall', {from: socket.id, offer: data.offer});
    })

	socket.on("answerCall", (data) => {
		console.log(`answering call ${socket.id} -> ${data.toCall}`)
        io.to(data.toCall).emit('callAnswered', {from: socket.id, answer: data.answer});
    })

    socket.on("returnCall", (data) => {
    	console.log(`returning call ${socket.id} -> ${data.toCall}`)
    	io.to(data.toCall).emit('callback', {from: socket.id});
    })



	io.on('disconnect', () => { console.log(`Disconnecting ${socket.id}`) });
});

app.get('/api/users', (req, res) => {
	// const Users = [
	// 	{Name: 'Austin', Socket: 'S'},
	// 	{Name: 'Brian', Socket: 'S'},
	// 	{Name: 'Helena', Socket: 'S'}
	// ];

	res.json(Users);
});
 
app.get('/api/match/:socket', (req, res) => {
	for(user of users) {
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

	users.push(newUser);
	res.json(users);
});

const port = 5000;

server.listen(port, () => console.log(`Server started on port ${port}`));