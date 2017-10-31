var socket = io();

// chat
socket.on('newMsg', function (msg) {
    console.log('newMsg', msg);
    $('#chat-content').append('<br/><strong>' + msg.name + '</strong> : ' + msg.content);
    $('#chat-content').scrollTop($('#chat-content')[0].scrollHeight);
    if (!$('#myModal').is(':visible')) {
        $('#btnChat').switchClass("btn-primary", "btn-danger")
    }
});

$('#btnSend').click(function () {
    socket.emit('sendMsg', $('#message-text').val());
    $('#message-text').val("");
});

$('#myModal').on('shown.bs.modal', function () {
    $('#message-text').focus();
    $('#btnChat').switchClass("btn-danger", "btn-primary")
})

$('#chatForm').submit(function (e) {
    return false;
});

// mastermind
var number = 0;
var canvas = document.getElementById('boardCanvas');
var ctx = canvas.getContext('2d');
var cellWidth = 40;
var canvasWidth = 280;
var canvasHeight = 12 * cellWidth;
var strokeWidth = 1;
var radius = cellWidth / 2 - strokeWidth;
var gameover = false;
var turn = 0;
var decalageBoard1 = 120;
var currentCombination = [0, 0, 0, 0];
var wait = true;
var decalageBoard2 = decalageBoard1 + 5 * cellWidth;

socket.on('forbidden', function (data) {
    if (data == 'no_place_available') {
        $('.game').html('<h2>Désolé, le serveur est plein.</h2>');
    }
});

socket.on('status', function (state) {
    console.log(state);
    if (state == 'ready') {
        $('#boardContainer').show();
        drawBoard(decalageBoard1);
        drawCombination(decalageBoard1);
        drawBoard(decalageBoard2);
        drawCoins(0, 1);
        wait = false;
        $('#info').html("Choisissez la combinaison à faire deviner");
    }
    if (state == 'not-ready') {
        $('#boardContainer').hide();
        $('#info').html('<span class="glyphicon glyphicon-hourglass" aria-hidden="true"></span> En attente de l\'adversaire');
    }
    if (state == 'set') {
        turn++;
        drawCoins(turn, 2)
        wait = false;
        $('#info').html("A vous de jouer");
    }
    if (state == 'nextTurn') {
        turn++;
        wait = false;
        drawCoins(turn, 2)
        $('#info').html("A vous de jouer");
    }
});

socket.on('number', function (num) {
    $('#playerNumber').html(num);
    number = num;
});

socket.on('gameover', function (num, combination1, combination2) {
    console.log('gameover', num, combination1, combination2, number);
    if (num == 0) {
        $('#info').html('<span class="glyphicon glyphicon-flash" aria-hidden="true"></span> Egalité !');
    }
    else if (number == num) {
        $('#info').html('<span class="glyphicon glyphicon-thumbs-up" aria-hidden="true"></span> Vous avez gagné !');
    }
    else {
        $('#info').html('Vous avez perdu !');
    }

    $('#info').effect('pulsate');

    if (number == 1) {
        drawCoins(0, 2, combination2)
    }
    else {
        drawCoins(0, 2, combination1)
    }

    gameover = true;
    wait = true;
});

socket.on('correction', function (correction) {
    console.log('correction', correction.player, correction.correction);
    if (number == correction.player) {
        drawCorrection(2, correction.correction);
    }
    else {
        drawCorrection(1, correction.correction);
    }
});

socket.on('combination', function (combination) {
    console.log('combination', combination.player, combination.combination);
    if (number != combination.player) {
        drawCoins(turn, 1, combination.combination);
    }
});

function drawBoard(decalage) {
    //draw columns
    for (var i = 0; i < 4 + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth + decalage, 0);
        ctx.lineTo(i * cellWidth + decalage, 10 * cellWidth);
        ctx.stroke();
    }

    // draw lines
    for (var i = 0; i < 10 + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(0 + decalage, i * cellWidth);
        ctx.lineTo(4 * cellWidth + decalage, i * cellWidth);
        ctx.stroke();
    }
}

function resetCurrentCombination() {
    currentCombination = [0, 0, 0, 0];
}

function drawCombination(decalage) {
    //draw columns
    for (var i = 0; i < 4 + 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth + decalage, 12 * cellWidth);
        ctx.lineTo(i * cellWidth + decalage, 11 * cellWidth);
        ctx.stroke();
    }

    // draw lines
    for (var i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(0 + decalage, (11 + i) * cellWidth);
        ctx.lineTo(4 * cellWidth + decalage, (11 + i) * cellWidth);
        ctx.stroke();
    }
}

function getColor(number) {
    var colors = ["white", "green", "purple", "red", "orange", "yellow", "black"];
    return colors[number];
}

function currentCombinationValid() {
    var frequency = {};  // array of frequency.
    var max = 0;  // holds the max frequency.
    for (var v in currentCombination) {
        frequency[currentCombination[v]] = (frequency[currentCombination[v]] || 0) + 1; // increment frequency.
        if (frequency[currentCombination[v]] > max) { // is this frequency > max so far ?
            max = frequency[currentCombination[v]];  // update max.
        }
    }

    var isValid = max == 1
    console.log('isValid', isValid, currentCombination)

    if (!isValid) {
        $('#info').html('Vous ne pouvez pas jouer cette combinaison !');
        $('#info').effect('pulsate');
    }

    return isValid;
}

function drawCoins(turn, board, combination) {
    console.log('drawCoins', turn, board, combination);
    // draw coins
    for (var i = 0; i < 4; i++) {
        ctx.beginPath();

        if (typeof (combination) != "undefined") {
            ctx.fillStyle = getColor(combination[i]);
        }
        else {
            ctx.fillStyle = "white";
        }

        if (turn == 0) {
            if (board == 1) {
                ctx.arc(decalageBoard1 + i * cellWidth + cellWidth / 2,
                    (12 * cellWidth) - cellWidth / 2,
                    radius, 0, 2 * Math.PI, false);
            }
            else {
                ctx.arc(decalageBoard1 + i * cellWidth + 5 * cellWidth + cellWidth / 2,
                    (12 * cellWidth) - cellWidth / 2,
                    radius, 0, 2 * Math.PI, false);
            }
        }
        else {
            if (board == 1) {
                ctx.arc(decalageBoard1 + i * cellWidth + cellWidth / 2,
                    ((11 - turn) * cellWidth) - cellWidth / 2,
                    radius, 0, 2 * Math.PI, false);
            }
            else {
                ctx.arc(decalageBoard1 + i * cellWidth + 5 * cellWidth + cellWidth / 2,
                    ((11 - turn) * cellWidth) - cellWidth / 2,
                    radius, 0, 2 * Math.PI, false);
            }
        }
        ctx.fill();
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
    }
}

function drawCorrection(board, correction) {
    for (var i = 0; i < 4; i++) {
        ctx.beginPath();

        if (correction[i] == 2) {
            ctx.fillStyle = "black"
        }
        else if (correction[i] == 1) {
            ctx.fillStyle = "white";
        }

        else {
            continue;
        }

        if (board == 1) {
            ctx.arc(decalageBoard1 - cellWidth - 4 * radius + i * radius + radius / 2,
                ((11 - turn) * cellWidth) - cellWidth / 2,
                radius / 2, 0, 2 * Math.PI, false);
        }
        else {
            ctx.arc(decalageBoard2 + 5 * cellWidth + i * radius + radius / 2,
                ((11 - turn) * cellWidth) - cellWidth / 2,
                radius / 2, 0, 2 * Math.PI, false);
        }

        ctx.fill();
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = '#003300';
        ctx.stroke();
    }
}

$("#boardCanvas").click(function (e) {
    if (!wait) {
        var parentOffset = $(this).offset();
        if (turn != 0) {
            var relX = e.pageX - parentOffset.left - (decalageBoard2);
            var position = Math.floor(relX / cellWidth) + 1;
            console.log(position);
            if (position > 0 && position < 5) {
                currentCombination[position - 1] = (++currentCombination[position - 1]) % 8;
            }
            console.log(currentCombination);
            drawCoins(turn, 2, currentCombination);
        }
        else {
            var relX = e.pageX - parentOffset.left - (decalageBoard1);
            var position = Math.floor(relX / cellWidth) + 1;
            console.log(position);
            if (position > 0 && position < 5) {
                currentCombination[position - 1] = (++currentCombination[position - 1]) % 8;
            }
            console.log(currentCombination);
            drawCoins(0, 1, currentCombination);
        }
    }
    return false;
});

$(document).keypress(function (event) {
    if (event.which == 13) {
        if (!$('#myModal').is(':visible')) {

            console.log('valid');
            if (!wait) {
                if (turn == 0 && currentCombinationValid()) {
                    socket.emit('setCombination', currentCombination);
                    console.log('setCombination', currentCombination);
                    resetCurrentCombination();
                    wait = true;
                    $('#info').html('<span class="glyphicon glyphicon-hourglass" aria-hidden="true"></span> En attente de l\'adversaire');
                } else if (currentCombinationValid()) {
                    socket.emit('play', currentCombination);
                    console.log('play', currentCombination);
                    resetCurrentCombination();
                    wait = true;
                    $('#info').html('<span class="glyphicon glyphicon-hourglass" aria-hidden="true"></span> En attente de l\'adversaire');
                }
            }
        }
        else {
            socket.emit('sendMsg', $('#message-text').val());
            $('#message-text').val("");
        }
    }
});