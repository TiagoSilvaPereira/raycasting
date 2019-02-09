var app = {

    init() {
        this.map = map01;

        this.screenStrips = [];
        this.numTextures = 4;

        this.mapWidth = this.map[0].length;		// Number of map blocks in x-direction
        this.mapHeight = this.map.length;		// Number of map blocks in y-direction
        this.miniMapScale = 8;	                // How many pixels to draw a map block

        this.screenWidth = 640;
        this.screenHeight = 480;

        this.stripWidth = 2;            // Strip width in pixels
        this.fov = 60 * Math.PI / 180;  // FOV is 60 degrees in radians
        this.fovHalf = this.fov / 2;

        // Calculate the quantity of rays (ceil returns the smallest integer greater than or equal to the given number)
        // Eg: 320 / 2 = 160 rays
        this.numRays = Math.ceil(this.screenWidth / this.stripWidth);
        
        // Using tan(30 degress) to get the distance (adjacent leg)
        this.viewDistance = (this.screenWidth / 2) / Math.tan((this.fov / 2));

        // Two PI is 360 degrees in radians
        this.twoPI = Math.PI * 2;

        this.setupInputs();
        this.initScreen();
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

    castRays() {

        let stripIndex = 0;

        for(var currentRay = 0; currentRay < this.numRays; currentRay++) {
            // Where does ray go through?
            let rayScreenPos = (-this.numRays/2 + currentRay) * this.stripWidth;

            // Distance from viewer to the point on screen (Hypotenuse)
            // The triangle is formed by: adjacent leg (viewDistance) and
            // opposite leg (rayScreenPos)
            let rayViewDistance = Math.sqrt(rayScreenPos*rayScreenPos + this.viewDistance*this.viewDistance);

            // Angle of the ray, relative to the viewing direction (asin returns the angle in radians, based on sine - arc sine)
            let raySine = rayScreenPos / rayViewDistance;
            let rayAngle = Math.asin(raySine);
            
            this.castSingleRay(
                this.player.rotation + rayAngle,
                stripIndex++
            );
        }

    },

    castSingleRay(rayAngle, stripIndex) {
        // Keep the angle beetween 0 - 360 degress
        rayAngle %= this.twoPI;
        if(rayAngle < 0) rayAngle += this.twoPI;

        // Is ray moving right/left? Up/down? Determined by angle quadrant
        let right = (rayAngle > this.twoPI * 0.75 || rayAngle < this.twoPI * 0.25);
        let up = (rayAngle < 0 || rayAngle > Math.PI);

        let wallType = 0;

        let angleSin = Math.sin(rayAngle);
        let angleCos = Math.cos(rayAngle);

        let distance = 0,

            // X,Y coordinates of where the ray hit the block
            xHit = 0,
            yHit = 0,

            // What part of texture we are going to render
            textureX,

            // Move through the map by ray inclination (slope)
            slope = angleSin / angleCos,
            directionX = right ? 1 : -1,
            directionY = directionX * slope,

            // Calculate ray starting positions. For x we start from edge of current
            // map block, and for y, the small horizontal step we just made 
            // multiplied by the slope
            x = right ? Math.ceil(this.player.x) : Math.floor(this.player.x),
            y = this.player.y + (x - this.player.x) * slope;

        while(x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            
            let wallX = Math.floor(x + (right ? 0 : -1));
            let wallY = Math.floor(y);

            // Is this point inside a wall?
            if(this.map[wallY][wallX] > 0) {
                let distanceX = x - this.player.x,
                    distanceY = y - this.player.y;
                
                // Distance from player to point, squared
                distance = distanceX*distanceX + distanceY*distanceY;

				wallType = this.map[wallY][wallX];
                textureX = y % 1; // Calculate the texture x coordinate
                if(!right) textureX = 1 - textureX; // Reverse texture when looking to left side

                xHit = x;
                yHit = y;

                break;
            }

            x += directionX;
            y += directionY;

        }

        // Now let's check the horizontal lines
        slope = angleCos / angleSin,
        directionY = up ? -1 : 1,
        directionX = directionY * slope,
        y = up ? Math.floor(this.player.y) : Math.ceil(this.player.y),
        x = this.player.x + (y - this.player.y) * slope;
        
        while(x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight) {
            let wallY = Math.floor(y + (up ? -1 : 0));
            let wallX = Math.floor(x);

            if(this.map[wallY][wallX] > 0) {
                let distanceX = x - this.player.x,
                    distanceY = y - this.player.y;
                
                // Distance from player to point, squared
                blockDistance = distanceX*distanceX + distanceY*distanceY;

                if(!distance || blockDistance < distance) {
                    distance = blockDistance;
                    xHit = x;
                    yHit = y;

				    wallType = this.map[wallY][wallX];
                    textureX = x % 1;
                    if(up) textureX = 1 - textureX;
                }

                break;
            }

            x += directionX;
            y += directionY;

        }

        if(distance) {
            //this.drawRay(xHit, yHit);

            let strip = this.screenStrips[stripIndex];

            distance = Math.sqrt(distance);
            
            // Adjust the distance for fisheye effect
            distance = distance * Math.cos(this.player.rotation - rayAngle);

            let height = Math.round(this.viewDistance / distance);
            let width = height * this.stripWidth;
            let top = Math.round((this.screenHeight - height) / 2);

            strip.style.height = height+"px";
            strip.style.top = top+"px";

            strip.img.style.height = Math.floor(height * this.numTextures) + "px";
            strip.img.style.width = Math.floor(width*2) +"px";
            strip.img.style.top = -Math.floor(height * (wallType-1)) + "px";

            var texX = Math.round(textureX*width);

            if (texX > width - this.stripWidth)
                texX = width - this.stripWidth;

            strip.img.style.left = -texX + "px";
        }

    },

    drawRay(rayX, rayY) {
        var miniMapObjects = document.getElementById('minimapobjects');
        var objectCtx = miniMapObjects.getContext('2d');
    
        objectCtx.strokeStyle = 'rgba(0,100,0,0.3)';
        objectCtx.lineWidth = 0.5;
        objectCtx.beginPath();
        objectCtx.moveTo(this.player.x * this.miniMapScale, this.player.y * this.miniMapScale);
        objectCtx.lineTo(
            rayX * this.miniMapScale,
            rayY * this.miniMapScale
        );
        objectCtx.closePath();
        objectCtx.stroke();
    },

    initScreen() {
        var screen = document.getElementById('screen');
        console.log(this.screenWidth);
        for (var i=0;i<this.screenWidth;i+=this.stripWidth) {
            var strip = document.createElement('div');
            strip.style.position = 'absolute';
            strip.style.left = i + 'px';
            strip.style.width = this.stripWidth+'px';
            strip.style.height = '0px';
            strip.style.overflow = 'hidden';

            strip.style.backgroundColor = 'magenta';

            var image = new Image();
            image.src = 'walls.png';
            image.style.position = 'absolute';
            image.style.left = '0px';

            strip.appendChild(image);
            strip.img = image;

            this.screenStrips.push(strip);
            screen.appendChild(strip);
        }
    },

    drawStrip(stripIndex, distance, rayAngle, wallType) {

        

    },

    updateScene() {
        this.movePlayer();
        this.updateMiniMap();
        this.castRays();

        setTimeout(this.updateScene.bind(this), 1000/30); // 30 FPS
    },

}

app.init();