const tao = 2 * Math.PI;

//set up canvas
var canvas = document.getElementById('display-canvas'); 
var {width: canvasWidth, height: canvasHeight} = canvas;
var context = canvas.getContext('2d');



var isAnimationActive = true;
var sprites = [];


//represents a sprite to be rendered on screen
class Sprite {
    constructor(id, height, width, positionX = 0, positionY = 0, velocityX = 0, velocityY = 0) {
        this.id = id;
        this.active = true;
        this.positionX = positionX;
        this.positionY = positionY;
        this.rotation = 0;
        this.height = height;
        this.width = width;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.angVel = 0;
    }
    setActive(active){
        this.active = active;
    }
    setPosition(x,y){
        this.positionX = x;
        this.positionY = y;
    }
    setRotation(rotation){
        this.rotation = rotation;
    }
    setSize(height,width){
        this.height = height;
        this.width = width;
    }
    update(deltaTime){
        this.setPosition(
            this.positionX + (deltaTime * this.velocityX),
            this.positionY + (deltaTime * this.velocityY)
        );
        if(this.angVel != 0){
            this.setRotation(
                this.rotation + (this.angVel * deltaTime)
            );
        }
    }
}

// Emitter function to create new sprites
var emitSprite = function(
    emitterX, 
    emitterY,
    speed = 100,
    angle = Math.random() * tao
){

    // Calculate velocity components based on angle
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

     // Create a new sprite with velocity
     const newSprite = new Sprite(
        sprites.length,
        20,
        20,
        emitterX,
        emitterY,
        velocityX,
        velocityY
    );

    // Set the velocity
    newSprite.velocityX = velocityX;
    newSprite.velocityY = velocityY;

    console.log('emitSprite : emitterX',emitterX,'emitterY',emitterY);

    sprites.push(newSprite);
}


var onUpdate = function(deltaTime){
    if(!isAnimationActive){
        return;
    }

    sprites.forEach(element => {
        element.update(deltaTime);
    });
    sprites.forEach((sprite) => {
        if (
            sprite.positionX < 0 || sprite.positionX > canvasWidth ||
            sprite.positionY < 0 || sprite.positionY > canvasHeight
        ) {
            sprite.setActive(false);
        }
    });
    //todo delete sprites that go off screen


}

var drawBoxSprite = function(sprite,color){
    if(!sprite.active){
        return;
    }
    context.save();
    context.rotate(sprite.rotation);
    context.fillStyle = color;
    context.fillRect(
        sprite.positionX - (sprite.width/2),
        sprite.positionY - (sprite.height/2),
        sprite.width,
        sprite.height
    );
    context.restore();
}

//rendering loop
var lastTime = 0;
//time is ms since landed on page  (float)
var vsyncLoop = function (time) {

    //schedule work for next frame
    requestAnimationFrame(vsyncLoop);

    var deltaTime = (time-lastTime)/1000; //fractions of a second
    lastTime = time;
    console.log('vsyncLoop : deltaTime',deltaTime);

    
    //Clear old content
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    sprites.forEach(element => {
        drawBoxSprite(element,'#FFF');
    });


    onUpdate(deltaTime);
}

setInterval(() => {
    emitSprite(canvasWidth / 2, canvasHeight / 2); // Emit from center
}, 500);

requestAnimationFrame(vsyncLoop);