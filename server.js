const express = require('express');

const app = express();

app.get('/api/users', (req, res) => {
	const Users = [
		{uid: 0, Name: 'Austin'},
		{uid: 1, Name: 'Brian'},
		{uid: 2, Name: 'Helena'}
	];

	res.json(Users);
});

const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));