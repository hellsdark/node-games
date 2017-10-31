var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, '.') + '/mastermind.html');
});

app.use(express.static(path.resolve(__dirname, '.')));

var player1 = false;
var player2 = false;
var current = 1;
var combination1 = [];
var combination2 = [];
var currentTurn = 0;
var currentTurnNb = 0;
var win1 = false;
var win2 = false;

io.on('connection', function (socket) {
    if (!player1) {
        player1 = true;
        socket.player = 1;
    }
    else if (!player2) {
        player2 = true;
        socket.player = 2;
    }
    else {
        socket.emit('forbidden', 'no_place_available');
        return;
    }

    console.log('player ' + socket.player + ' logged in.');
    socket.emit('number', socket.player);

    if (player1 && player2) {
        console.log('ready');
        resetBoard();
        io.emit('status', 'ready');
    }
    else {
        io.emit('status', 'not-ready');
    }

    socket.on('sendMsg', (msg) => {
        console.log('sendMsg', msg);
        io.emit('newMsg', { name: "Joueur " + socket.player, content: msg });
    });

    socket.on('setCombination', combination => {
        console.log('setCombination', socket.player, combination);
        if (socket.player == 1) {
            combination1 = combination;
        }
        else {
            combination2 = combination;
        }
        if (combination1.length > 0 && combination2.length > 0) {
            currentTurn = 1;
            io.emit('status', 'set');
        }
    });

    socket.on('play', combination => {
        console.log('player ' + socket.player + ' played=>' + combination);

        io.emit('combination', { 'combination': combination, 'player': socket.player });

        var correction = correct(combination, socket.player);
        io.emit('correction', { correction: correction, player: socket.player });

        currentTurnNb++;

        if (currentTurnNb == 2) {
            currentTurn++;
            currentTurnNb = 0;
            io.emit('status', 'nextTurn');
            console.log('nextTurn');
            if (win1 && win2) {
                io.emit('gameover', 0, combination1, combination2);
            }
            else if (win1) {
                io.emit('gameover', 1, combination1, combination2);
            }
            else if (win2) {
                io.emit('gameover', 2, combination1, combination2);
            }
            else if (currentTurn == 11) {
                io.emit('gameover', 0, combination1, combination2);
            }
        }
    });

    var correct = function (combination, player) {
        console.log('correct', player, combination);

        var combinationReference;
        var answer = [];
        if (player == 1) {
            combinationReference = combination2;
        }
        else if (player == 2) {
            combinationReference = combination1;
        }
        for (var i = 0; i < 4; i++) {
            if (combination[i] == combinationReference[i]) {
                answer[i] = 2;
            }
            else if (combinationReference.indexOf(combination[i]) > -1) {
                answer[i] = 1;
            }
            else {
                answer[i] = 0;
            }
        }

        win(combination, player);
        return answer.sort();
    }

    socket.on('restart', () => resetBoard());

    socket.on('disconnect', () => {
        console.log('player ' + socket.player + ' disconnected');
        if (socket.player == 1 || socket.player == 2) {
            if (socket.player == 1) {
                player1 = false;
            }
            else if (socket.player == 2) {
                player2 = false;
            }
            resetBoard();
            io.emit('status', 'not-ready');
        }
    });
});

function resetBoard() {
    combination1 = [];
    combination2 = [];
    win1 = false;
    win2 = false;
}

function win(combination, player) {
    if (player == 1) {
        if (combination.join() === combination2.join()) {
            console.log('win', player, combination);
            win1 = true;
        }
    }
    else if (player == 2) {
        if (combination.join() === combination1.join()) {
            console.log('win', player, combination);
            win2 = true;
        }
    }
}

let port = 3005;
http.listen(port, () => console.log('mastermind server listening on *:' + port));
