(function(){

// "local" globals, available within this closure

function collisionHandler(player, object){
  console.log(this)
  this.scene.start('MenuScene');
  this.physics.pause();
  gameOver = true;
}

function updateSpotlight(spotlight, x, y){
  spotlight.x = x;
  spotlight.y = y;
}

function createPathFinder(map){
// takes a map object and creates an EasyStar path finder from it
// Most of this code is taken from: http://www.dynetisgames.com/2018/03/06/pathfinding-easystar-phaser-3/
// Modified to work with maps with multiple layers, each of which can have collideable tiles.
// Each layer in the map must have the same height and width

// instantiate a new pathfinder object
var finder = new EasyStar.js();

// create a 2D grid of map height x map width, initialized to all zero's.
// for our pathfinder, 0 will represent walkable tiles,
// and 1 represents collideable.
// other numbers may be added later to represent various costs
var grid = Array(map.height).fill().map(()=>{return Array(map.width).fill(0)});

// create an object to store the properties of every tile in every tileset in the map
var tiles = {};
// loop through each tileset in the map
for (let tileset of map.tilesets){
  // copy the tile properties in this tileset into tiles
  Object.assign(tiles, tileset.tileProperties);
}
gtiles = tiles; //DEBUGGING

// loop through each map layer
for (let layer of map.layers){
  var data = layer.data;
  // loop through the layer's data 2D array
  for (let r = 0; r < map.height; r++){
    for (let c = 0; c < map.width; c++){
      // get  the index of this tile
      var index = data[r][c].index;
      // if this index is in tiles, and the "Collides" property is set,
      // then set this coordinate in the grid to 1
      if (tiles[index] && tiles[index].Collides) {
        grid[r][c] = 1;
      }
    }
  }
}

finder.setGrid(grid);
finder.setAcceptableTiles([0]);

// ggrid = grid; // DEBUGGING

return finder;
}

function collidePlayerEnemy(player, enemy){
  player.x = 80;
  player.y = 700;
  player.setTint(0xff0000);
}

function collectItem(player, item) {
  player.setTint(0xff0000);

  console.log(player);
  
  console.log(`${item.name} added to inventory`);


  item.destroy();
}


// function collectDiamonds (player, diamond)
// {
//   diamond.disableBody(true, true);
//   this.diamondCollectSound.play();
//   //  Add and update the score
//   points += 10;
//   points_text.setText(points);

// }

function collidePlayerSword(player, sword) {
  // game logic
  player.items.swordCount++;

  // update visuals
  attack_text.setText(player.items.swordCount);

  // play any sounds
  // this.swordCollectSound.play();

  sword.destroy();
}

function collidePlayerDiamond(player, diamond) {
  // game logic
  // player.items.diamondCount++;

  // update visuals
  points += 10;
  points_text.setText(points);

  // play any sounds
  this.diamondCollectSound.play();

  diamond.destroy();
}

GameScene = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize:


        function GameScene() {
            Phaser.Scene.call(this, {
                key: 'GameScene'
            });
        },
    preload: function () {
      // load the map for this level

      this.load.image('stats-bar', 'assets/button-start.png');

      var tilemapName = "mainmap";
      var tilemapFilePath = `/assets/${tilemapName}.json`;
      this.load.tilemapTiledJSON(tilemapName, tilemapFilePath);
      var tilesetNames = ['horror_rpg_tileset1', 'horror_rpg_tileset2', 'horror_rpg_tileset3', 'horror_rpg_tileset4', 'horror_rpg_tileset5', 'horror_rpg_tileset6'];
      tilesetNames.forEach((name)=>{
        this.load.image(name, `/assets/${name}.png`);
      });

      this.createMap = function(tilemapName){
        const map = this.make.tilemap({
            key: tilemapName
            // tileWidth: 32,
            // tileHeight: 32
        });
        this.map = map;
        gmap = map; // DEBUGGING
        console.log(gmap);
        
        map.tilesets.forEach((tileset)=>{
          map.addTilesetImage(tileset.name, tileset.name);
        });
        
        map.layers.forEach((layer)=>{
          map.createDynamicLayer(layer.name, map.tilesets);
        });

        var tilemapLayers = map.layers.map((layer)=>{
          return layer.tilemapLayer;
        })
        this.gameContainer = this.add.container(0,0,tilemapLayers);
        gcontainer = this.gameContainer; // DEBUGGING
        // OLD MAP CREATION CODE
        // const magecityTileSet = map.addTilesetImage( "magecity", "magecity");
        // const wallTileSet = map.addTilesetImage( "walls", "walls");
        // const treesTileSet = map.addTilesetImage( "trees_plants", "trees");
        // const dungeonTileSet = map.addTilesetImage( "ProjectUtumno_full", "dungeon");
        
        // var tilesets = [magecityTileSet, wallTileSet, treesTileSet, dungeonTileSet];
        // var tilesets = map.tilesets;
        // map.createDynamicLayer("bottomLayer", tilesets);
        // map.createDynamicLayer("mediumLayer", tilesets);
        // map.createDynamicLayer("topLayer", tilesets);
        // map.createDynamicLayer("treeLayer", tilesets);

        return map;
      }

      // Helper functions
      // shortcut for this.physics.add.sprite
      this.physicsAdd = function(x, y, spriteKey){
        let aligned = m(x, y);
        var object = this.physics.add.sprite(aligned.x, aligned.y, spriteKey);
        object.setMask(this.circleMask);
        return object;
      }
      // creates map colliders from layer properties
      this.createMapCollider = function(){
        //TODO: change property "Collides" to "collides"
        this.map.layers.forEach((layer)=>{
          layer.tilemapLayer.setCollisionByProperty({collides: true});
        })
      }

      this.addMapCollider = function(object){
        // adds collision between the given objects and each map layer in layers
        this.map.layers.forEach((layer)=>{
          this.physics.add.collider(object, layer.tilemapLayer)
        });
      }

      this.createSword = function(x,y){
        var sword = this.physicsAdd(x,y,'sword');
        sword.setOrigin(0);
        return sword;
      }

      this.createDiamond = function(x,y){
        var diamond = this.physicsAdd(x,y,'diamond');
        diamond.setOrigin(0);
        return diamond;
      }
    },
    create: function () {
        const map = this.createMap("mainmap");

        // SHORTCUT FUNCTIONS
        // create a shortcut of the toTileCoordinates function, bound to the map in this scene
        t = toTileCoordinates.bind(map);
        // shortcut for toWorldCoordinates, similar to above
        w = toWorldCoordinates.bind(map);
        // shortcut for alignWithMap

        m = alignWithMap.bind(map);

        // create map colliders from the "collides" property in the layers
        // this.createMapCollider();

        // create the pathfinder for the map
        this.finder = createPathFinder(map);

        // create spotlight mask to follow player
        spotlight = this.make.sprite({
          x: 0,
          y: 0,
          key: 'mask1',
          add: false
        }).setDisplaySize(300,300);
        circle = this.make.sprite({
          x: 0,
          y: 0,
          key: 'mask2',
          add: false
        }).setDisplaySize(300,300);
        this.spotlight = spotlight;
        this.circle = circle;
        this.spotlightMask = new Phaser.Display.Masks.BitmapMask(this, spotlight);
        this.circleMask = new Phaser.Display.Masks.BitmapMask(this, circle);
        this.gameContainer.setMask(this.spotlightMask);

        // add some enemies
        var enemy1 = Enemy(this.physicsAdd(96, 512, 'zombi'));
        var enemy2 = Enemy(this.physicsAdd(266, 490, 'zombi'));

        // set the patrol path that the enemies will follow
        // below lines commented out until pathfinder is working with new map
        enemy1.createPatrol(t(32,896));
        // enemy2.createPatrol(t(410,230));
        
        diamond1 = this.createDiamond(288, 320);
        diamond1.setOrigin(0,0);

        this.camera = this.cameras.main;

        this.input.on('pointerup', function(pointer){
          var x = this.scene.camera.scrollX + pointer.x;
          var y = this.scene.camera.scrollY + pointer.y;
          console.log(m(x,y)); // DEBUGGING
          console.log(t(x,y)); // DEBUGGING
        });

        // TODO: move this logic into a createPlayer function
        player = this.physicsAdd(2085, 1584, 'zombi');
        player.items = {};
        player.items.swordCount = 0;
        player.items.diamondCount = 0;

        console.log(player.body._bounds.width);
        
        sword1 = this.createSword(50, 400);
        sword1.setDisplaySize(32, 32);

        sword1.name = "sword"
        // this.physics.add.collider(player, items.sword);


        // change player's hitbox size
        player.body.setSize(20,20);
        player.body.setOffset(14,28);

        //Player animations
        const anims = this.anims;
        anims.create({
            key: "left",
            frames: anims.generateFrameNumbers('zombi', {
                start: 3,
                end: 5
            }),
            frameRate: 10,
            repeat: -1
        });
        anims.create({
            key: "idle",
            frames: [{
                key: 'zombi',
                frame: 1
            }],
            frameRate: 10,
            repeat: -1
        });
        anims.create({
            key: "right",
            frames: anims.generateFrameNumbers('zombi', {
                start: 6,
                end: 8
            }),
            frameRate: 10,
            repeat: -1
        });
        anims.create({
            key: "up",
            frames: anims.generateFrameNumbers('zombi', {
                start: 9,
                end: 11
            }),
            frameRate: 10,
            repeat: -1
        });
        anims.create({
            key: "down",
            frames: anims.generateFrameNumbers('zombi', {
                start: 0,
                end: 2
            }),
            frameRate: 10,
            repeat: -1
        });

        //Enable keyboard movement
        cursors = this.input.keyboard.createCursorKeys();

        graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.3);
        graphics.fillRect(0, 0, 960, 960);
        graphics.setVisible(true);

        diamond = this.physics.add.group({
          key: 'diamonds',
          repeat: 3,
          setXY: { x: 100, y: 750, stepX: 70}
        });

        sword          = this.physics.add.image(100, 600, 'attack').setDisplaySize(60, 30);

        stats_diamonds = this.add.image(0, 0, 'stats-bar').setDisplaySize(200, 150);
        img_diamond    = this.add.image(-30, 0, 'diamond-stats').setDisplaySize(25, 25);

        stats_attack   = this.add.image(0, 0, 'stats-bar').setDisplaySize(200, 150);
        img_sword      = this.add.image(-30, 0, 'attack').setDisplaySize(70, 40);

        stats_timer    = this.add.image(0, 0, 'stats-bar').setDisplaySize(200, 150);
        img_timer      = this.add.image(-40, 0, 'hourglass-stats').setDisplaySize(30, 30);

        stats_lives    = this.add.image(0, 0, 'stats-bar').setDisplaySize(200, 150);
        img_lives      = this.add.image(-30, 0, 'heart-stats').setDisplaySize(30, 30);

        diamondContainer  = this.add.container(250, 850, [ stats_diamonds, img_diamond ]);
        attackContainer   = this.add.container(433, 850, [ stats_attack, img_sword ]);
        timerContainer    = this.add.container(616, 850, [ stats_timer, img_timer ]);
        livesContainer    = this.add.container(800, 850, [ stats_lives, img_lives ]);
        
        diamondContainer.setSize(stats_diamonds.width, img_diamond.height);
        attackContainer.setSize(stats_attack.width, img_sword.height);
        timerContainer.setSize(stats_timer.width, img_timer.height);
        livesContainer.setSize(stats_lives.width, img_lives.height);
         
        this.diamondCollectSound = this.sound.add("coinPickup");

        timer_text  = this.add.text(610, 830, timer,  { font: '30px Arial', fill:  '#ffffff' });
        timer = this.time.addEvent({ delay: 10000 });
        lives_text  = this.add.text(810, 830, lives,  { font: '30px Arial', fill:  '#ffffff' });
        points_text = this.add.text(260, 830, '0',    { font: '30px Arial', fill:  '#ffffff' });
        attack_text = this.add.text(440, 830, '0',    { font: '30px Arial', fill:  '#ffffff' });
        
        this.diamondCollectSound = this.sound.add("coinPickup");
        //   //Enable keyboard movement
        cursors = this.input.keyboard.createCursorKeys();
        //   scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

        bombs = this.physics.add.group();


        // setTimeout(() => {
        //     collectItem(player, items.sword)
        // }, 1000)
        // setTimeout(() => {
        //     console.log(player.inventory);

        // }, 2000)
        // physics collisions
        //TODO refactor to use player and item class from ./objects
        this.addMapCollider(player);
        this.physics.add.overlap(player, sword, collidePlayerSword);
        this.physics.add.overlap(player, diamond, collidePlayerDiamond);
        this.physics.add.overlap(player, enemy1, collidePlayerEnemy);
        this.physics.add.overlap(player, enemy2, collidePlayerEnemy);

        //Camera Layer
        // var camera1 = this.cameras.add(0, 0, 1200, 850).setZoom(.5);

        this.cameras.main.startFollow(player, true, 0.015, 0.015).setZoom(1);

        //  Enable lights and set a dark ambient color
        // this.lights.enable().setAmbientColor(0x333333);

        // //  Add an image and set it to use Lights2D
        // // var robot = this.add.image(-100, 0, 'robot').setOrigin(0).setScale(0.7);

        // this.cameras.main.setPipeline('Light2D');

        // //  Our spotlight. 100px radius and white in color.
        // var light = this.lights.addLight(180, 80, 200).setColor(0xffffff).setIntensity(2);

        // //  Track the pointer
        // this.input.on('pointermove', function (pointer) {

        //     light.x = pointer.x;
        //     light.y = pointer.y;

        // });


        map.layers[2].tilemapLayer.setCollisionByProperty({collides: true});


        //Use this to debug collidable walls.
//         const debugGraphics = this.add.graphics().setAlpha(0.75);
// map.layers[2].tilemapLayer.renderDebug(debugGraphics, {
//   tileColor: null, // Color of non-colliding tiles
//   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
//   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
// });
    },
      
  //UPATE

    update: function (time, delta) {
        if (gameOver) {
            return;
        }

        updateSpotlight(this.spotlight, player.x, player.y);
        updateSpotlight(this.circle, player.x, player.y);


        // Stop any previous movement from the last frame
        // cursors = this.input.keyboard.createCursorKeys();
        let speed = 175;
        let prevVelocity = player.body.velocity.clone();

        if (prevVelocity.x == 0 && prevVelocity.y == 0) {
            player.anims.play('idle');
        }
        player.body.setVelocity(0);

        // Horizontal movement
        if (cursors.left.isDown) {
            player.body.setVelocityX(-speed);
            player.anims.play('left', true);
        } else if (cursors.right.isDown) {
            player.body.setVelocityX(speed);
            player.anims.play('right', true);
        }

        // Vertical movement
        if (cursors.up.isDown) {
            player.body.setVelocityY(-speed);
            player.anims.play('up', true);
        } else if (cursors.down.isDown) {
            player.body.setVelocityY(speed);
            player.anims.play('down', true);
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        player.body.velocity.normalize().scale(speed);

        // //Updates Death Counts
        lives_text.setText(lives);

        // //Updates Timer
        timer_text.setText(Math.floor(10000 - timer.getElapsed()));

    },

    render: function(){
      
    }

});

})();
