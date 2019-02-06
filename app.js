var app = {

    init() {
        this.map = map01;

        this.mapWidth = this.map[0].length;		// Number of map blocks in x-direction
        this.mapHeight = this.map.length;		// Number of map blocks in y-direction
        this.miniMapScale = 8;	                // How many pixels to draw a map block

        this.setupInputs();
        this.setupPlayer();
        this.drawMiniMap();
        this.updateScene();
    },

    setupInputs() {
        
        document.onkeydown = function(e) {
            switch (event.keyCode) {
                // Up, move player forward, ie. increase speed
                case 38:
                    this.player.speed = 1; break;
                // Down, move player backward, set negative speed
                case 40:
                    this.player.speed = -1; break;
                // Left, rotate player left
                case 37:
                    this.player.direction = -1; break;
                // Right, rotate player right
                case 39:
                    this.player.direction = 1; break;
            }
        }.bind(this);

        // Stop the player movement/rotation when the keys are released
        document.onkeyup = function(event) {
            switch (event.keyCode) {
                case 38:
                case 40:
                    this.player.speed = 0; break;
                case 37:
                case 39:
                    this.player.direction = 0; break;
            }
        }.bind(this);

    },

    setupPlayer() {
        this.player = {
            x: 16,
            y: 10,
            direction: 0,
            rotation: 0,
            speed: 0,
            moveSpeed: 0.18,
            rotationSpeed: 6 * Math.PI / 180
        };
    },

    drawMiniMap() {
        
        let miniMap = document.getElementById('minimap');

        miniMap.width = this.mapWidth * this.miniMapScale;
        miniMap.height = this.mapHeight * this.miniMapScale;

        miniMap.style.width = (this.mapWidth * this.miniMapScale) + 'px';
        miniMap.style.height = (this.mapHeight * this.miniMapScale) + 'px';

        // Loop through map blocks
        var canvasContext = miniMap.getContext('2d');

        for(var y = 0; y < this.mapHeight; y++) {
            for(var x = 0; x < this.mapWidth; x++) {
                let wall = this.map[y][x];

                // If there is a wall at this map position
                if(wall > 0) {
                    canvasContext.fillStyle = 'rgb(200,200,200)';
                    canvasContext.fillRect(x * this.miniMapScale, y * this.miniMapScale, this.miniMapScale, this.miniMapScale);
                }

            }
        }

    },

    movePlayer() {
        let moveStep = this.player.speed * this.player.moveSpeed;
        
        this.player.rotation += this.player.direction * this.player.rotationSpeed;

        //console.log(this.player.rotation)

        // Calculate player position using sine/cosine of player rotation
        let newX = this.player.x + Math.cos(this.player.rotation) * moveStep;
        let newY = this.player.y + Math.sin(this.player.rotation) * moveStep;

        // Check collision before setting new player position
        if(this.isColliding(newX, newY)) return;

        this.player.x = newX;
        this.player.y = newY;
    },

    isColliding(x, y) {

        // Is outside the Level?
        if(y < 0 || y >= this.mapHeight || x < 0 || x >= this.mapWidth) {
            return true;
        }

        // Return if the player is colliding a block (map(y,x) != 0)
        return (this.map[Math.floor(y)][Math.floor(x)] != 0);
    },

    updateMiniMap() {
        var miniMap = document.getElementById('minimap');
        var miniMapObjects = document.getElementById('minimapobjects');

        var objectContext = miniMapObjects.getContext('2d');
        miniMapObjects.width = miniMapObjects.width;

        objectContext.fillStyle = 'red';
        objectContext.fillRect(		// Draw a dot at the current player position
            this.player.x * this.miniMapScale - 2, 
            this.player.y * this.miniMapScale - 2,
            4, 4
        );

        objectContext.strokeStyle = 'red';
        objectContext.beginPath();
        objectContext.moveTo(this.player.x * this.miniMapScale, this.player.y * this.miniMapScale);
        
        objectContext.lineTo(
            (this.player.x + Math.cos(this.player.rotation) * 4) * this.miniMapScale,
            (this.player.y + Math.sin(this.player.rotation) * 4) * this.miniMapScale
        );

        objectContext.closePath();
        objectContext.stroke();
    },

    drawScreen() {

    },

    updateScene() {
        this.movePlayer();
        this.updateMiniMap();

        setTimeout(this.updateScene.bind(this), 1000/30); // 30 FPS
    },

}

app.init();