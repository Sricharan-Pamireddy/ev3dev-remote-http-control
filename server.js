var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get("/", (req, res) => {
    res.write(Date.now());
    res.end();
});

io.on('connection', function (socket) {
    console.log('A user connected');

    socket.on('disconnect', async function () {
        console.log(`A user disconnected`);
    });
});

const port = 8001;

http.listen(port, function () {
    console.log(`WebServer started on port ${port}`);
});