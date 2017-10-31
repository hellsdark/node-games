var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, '.') + '/4connect.html');
});

app.use(express.static(path.resolve(__dirname, '.')));

var board = [];
var colHeights = [];
var player1 = false;
var player2 = false;
var current = 1;

io.on('connection', (socket) => {
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
        console.log(board);
    }

    socket.on('play', function (x) {
        console.log('played on ' + x + '=>' + colHeights[x - 1]);
        if (current != socket.player || !moveEnabled(x)) {
            console.log('wrong move : ' + x);
            socket.emit('forbidden', 'wrong_move');
        }
        else {
            board[x - 1][colHeights[x - 1]] = socket.player;
            colHeights[x - 1]++;
            if (current == 1) {
                current = 2;
            }
            else {
                current = 1;
            }

            console.log(board);
            io.emit('board', { 'board': board, 'player': current });
        }

        var winner = win();
        if (winner == 1 || winner == 2) {
            io.emit('gameover', winner);
            console.log('player ' + winner + ' won !');
        }
    });

    socket.on('restart', function () {
        resetBoard();
    });

    socket.on('disconnect', function () {
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
    board = [
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]
    ];
    colHeights = [0, 0, 0, 0, 0, 0, 0]
    current = 1;
    console.log('board reset');
    io.emit('board', { 'board': board, 'player': current });
}

function moveEnabled(x) {
    return (x > 0 && x <= 7 && colHeights[x - 1] < 7)
}

function win() {
    var currentPlayerHori = 0;
    var currentPlayerVerti = 0;
    var cumulVerti = 0;
    var cumulHori = 0;
    for (var i = 0; i < 7; i++) {
        for (var j = 0; j < 7; j++) {
            // check columns
            if (board[i][j] != currentPlayerVerti) {
                cumulVerti = 0;
                currentPlayerVerti = board[i][j];
            }
            if (currentPlayerVerti != 0) {
                cumulVerti++;
                if (cumulVerti == 4) {
                    return currentPlayerVerti;
                }
            }

            // check lines
            if (board[j][i] != currentPlayerHori) {
                cumulHori = 0;
                currentPlayerHori = board[j][i];
            }
            if (currentPlayerHori != 0) {
                cumulHori++;
                if (cumulHori == 4) {
                    return currentPlayerHori;
                }
            }
        }
        cumulHoriz = 0;
        comulVerti = 0;
        currentPlayerVerti = 0;
        currentPlayerHori = 0;
    }

    var currentPlayerDiag1 = 0;
    var currentPlayerDiag2 = 0;
    var cumulDiag1 = 0;
    var cumulDiag2 = 0;
    for (var k = 0; k < 6; k++) {
        for (var l = 6; l >= 0; l--) {
            // check diag 1
            for (var i = k, j = l; i < 6 && j >= 0; i++ , j--) {
                if (board[i][j] != currentPlayerDiag1) {
                    cumulDiag1 = 0;
                    currentPlayerDiag1 = board[i][j];
                }
                if (currentPlayerDiag1 != 0) {
                    cumulDiag1++;
                    if (cumulDiag1 == 4) {
                        return currentPlayerDiag1;
                    }
                }
            }
            //check diag 2
            for (var i = k, j = l; i < 6 && j < 6; i++ , j++) {
                if (board[i][j] != currentPlayerDiag2) {
                    cumulDiag2 = 0;
                    currentPlayerDiag2 = board[i][j];
                }
                if (currentPlayerDiag2 != 0) {
                    cumulDiag2++;
                    if (cumulDiag2 == 4) {
                        return currentPlayerDiag2;
                    }
                }
            }
            cumulDiag1 = 0;
            comulDiag2 = 0;
            currentPlayerDiag1 = 0;
            currentPlayerDiag2 = 0;
        }
    }

    return 0;
}

http.listen(3001, function () {
    console.log('4connect listening on *:3001');
});
