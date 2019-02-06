var app = {

    init() {
        this.map = map01;

        this.mapWidth = this.map[0].length;		// Number of map blocks in x-direction
        this.mapHeight = this.map.length;		// Number of map blocks in y-direction
        this.miniMapScale = 8;	                // How many pixels to draw a map block

        this.drawMiniMap();
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

    drawScreen() {

    }

}

app.init();