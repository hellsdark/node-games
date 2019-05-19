var socket;

// websocket events

playerState = null;

let url = "images/01.png";
let worldWidth = 19;
let worldHeight = 20;
let spriteSize = 32;
let app = new PIXI.Application({
  width: worldWidth * spriteSize,
  height: worldHeight * spriteSize
});
let player;

PIXI.loader
  .add(url)
  .add("images/tileset.png")
  .load(run);
$("#canvas").append(app.view);

function run() {
  socket = io();
  console.log("run");
  socket.on("playerState", function(state) {
    console.log("on-playerState", state);
    playerState = state;

    runGame();
  });

  socket.on("playerStates", function(states) {
    console.log("on-playerStates", states);
  });

  socket.on("worldTiles", function(tiles) {
    console.log("on-worldtiles");
    if (tiles) drawTiles(tiles);
  });

  $(document).keydown(function(event) {
    if (event.which == 13) {
      //enter
    }
    if (event.which == 37) {
      event.preventDefault();
      playerState.x--;
    }
    if (event.which == 38) {
      event.preventDefault();
      playerState.y--;
    }
    if (event.which == 39) {
      event.preventDefault();
      playerState.x++;
    }
    if (event.which == 40) {
      event.preventDefault();
      playerState.y++;
    }
    socket.emit("playerState", playerState);
    console.log("playerState", playerState);

    refresh();
  });
}

function runGame() {
  console.log("init player");
  player = new PIXI.Sprite(PIXI.utils.TextureCache[url]);
  app.stage.addChild(player);
  player.width = spriteSize;
  player.height = spriteSize;
  player.x = playerState.x;
  player.y = playerState.y;
  player.zIndex = 1000;
  player.zOrder = 1000;
}

function drawTiles(tiles) {
  console.log("drawTiles", tiles);

  tiles.forEach(element => {
    //Create the `tileset` sprite from the texture
    let texture = PIXI.utils.TextureCache["images/tileset.png"];

    console.log("draw tile", element);
    //Create a rectangle object that defines the position and
    //size of the sub-image you want to extract from the texture
    //(`Rectangle` is an alias for `PIXI.Rectangle`)
    console.log("tile", element.tile);
    let rectangle = new PIXI.Rectangle(
      spriteSize * element.tile.x,
      spriteSize * element.tile.y,
      spriteSize,
      spriteSize
    );

    //Tell the texture to use that rectangular section
    texture.frame = rectangle;

    //Create the sprite from the texture
    let sprite = new PIXI.Sprite(texture);

    //Position the rocket sprite on the canvas
    sprite.x = spriteSize * element.x;
    sprite.y = spriteSize * element.y;

    //Add the rocket to the stage
    app.stage.addChild(sprite);

    //Render the stage
    app.renderer.render(app.stage);
  });

  console.log("end setup sprites");
}

function refresh() {
  console.log("refresh player position");
  player.x = playerState.x * spriteSize;
  player.y = playerState.y * spriteSize;
}
