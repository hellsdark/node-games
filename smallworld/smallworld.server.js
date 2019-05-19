var express = require("express");
var app = require("express")();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path = require("path");

app.get("/", function(req, res) {
  res.sendFile(path.resolve(__dirname, ".") + "/smallworld.html");
});

app.use(express.static(path.resolve(__dirname, ".")));

id = 0;
let playerStates = [];
let worldTiles = [
  { x: 0, y: 0, tile: { x: 8, y: 0 } },
  { x: 1, y: 0, tile: { x: 0, y: 1 } },
  { x: 2, y: 0, tile: { x: 0, y: 8 } },
  { x: 3, y: 0, tile: { x: 7, y: 0 } },
  { x: 4, y: 0, tile: { x: 0, y: 3 } },
  { x: 5, y: 0, tile: { x: 0, y: 0 } },
  { x: 6, y: 0, tile: { x: 2, y: 0 } },
  { x: 0, y: 1, tile: { x: 0, y: 0 } },
  { x: 1, y: 2, tile: { x: 0, y: 4 } },
  { x: 2, y: 3, tile: { x: 2, y: 0 } },
  { x: 3, y: 4, tile: { x: 0, y: 0 } },
  { x: 4, y: 5, tile: { x: 3, y: 5 } },
  { x: 5, y: 6, tile: { x: 6, y: 0 } },
  { x: 6, y: 7, tile: { x: 1, y: 3 } }
];

io.on("connection", socket => {
  socket.id = id++;
  playerStates[id] = { id: socket.id, x: 0, y: 0 };

  console.log("emit worldTiles");
  socket.emit("worldTiles", worldTiles);

  console.log("emit playerState");
  socket.emit("playerState", playerStates[id]);

  socket.on("playerState", message => {
    console.log("emit playerStates");
    io.emit("playerStates", playerStates);
  });

  socket.on("ping", () => console.log("pong"));

  socket.on("setTile", tile => {
    let existingTile = worldTiles.find(t => (t.x = tile.x && t.y == tile.y));
    if (existingTile) {
      existingTile.tile = tile.tile;
    } else {
      worldTiles.push(tile);
    }
  });
});

let port = process.argv[2] || 3006;
http.listen(port, function() {
  console.log("smallworld listening on *:" + port);
});
