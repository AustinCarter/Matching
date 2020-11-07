const express = require('express');
const http = require("http")
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const Users = {};

io.on('connection', socket => {
	console.log(`Connection from socket ${socket.id}`);
});

app.get('/api/users', (req, res) => {
	const Users = [
		{uid: 0, Name: 'Austin'},
		{uid: 1, Name: 'Brian'},
		{uid: 2, Name: 'Helena'}
	];

	res.json(Users);
});

const port = 5000;

server.listen(port, () => console.log(`Server started on port ${port}`));