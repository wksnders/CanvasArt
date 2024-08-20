const tao = 2 * Math.PI;

//set up canvas
var canvas = document.getElementById('display-canvas'); 
var {width: canvasWidth, height: canvasHeight} = canvas;
var context = canvas.getContext('2d');



var isAnimationActive = true;
var emitters = [];


//represents a sprite to be rendered on screen
class Sprite {
    constructor(id,width,height,color = '#FFF', positionX = 0, positionY = 0,rotation = 0, velocityX = 0, velocityY = 0,angVel = 0) {
        this.id = id;
        this.active = true;
        this.positionX = positionX;
        this.positionY = positionY;
        this.rotation = rotation;
        this.width = width;
        this.height = height;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.angVel = angVel;
        this.color = color;
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

class Emitter {
    constructor(emitterX, emitterY) {
        this.emitterX = emitterX;
        this.emitterY = emitterY;
        this.sprites = [];
    }

    emit(
        particleWidth = 40,
        particleHeight = 20,
        particleColor = '#FFF',
        speed = 100,
        angle = Math.random() * tao,
        rotationSpeed = 0
    ) {
        // Calculate velocity components based on angle
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        // Create a new sprite with velocity
        const newSprite = new Sprite(
            this.sprites.length, // TODO: Implement a new ID system
            particleWidth,
            particleHeight,
            particleColor,
            this.emitterX,
            this.emitterY,
            angle,
            velocityX,
            velocityY,
            rotationSpeed
        );

        console.log('Emitter emit : emitterX', this.emitterX, 'emitterY', this.emitterY);

        this.sprites.push(newSprite);
    }

    update(deltaTime) {
        this.sprites.forEach(sprite => {
            sprite.update(deltaTime);
        });
        this.sprites = this.sprites.filter(sprite => {
            return sprite.positionX > 0 && sprite.positionX < canvasWidth &&
                   sprite.positionY > 0 && sprite.positionY < canvasHeight;
        });
    }
}



var onUpdate = function(deltaTime){
    if(!isAnimationActive){
        return;
    }

    emitters.forEach(element => {
        element.update(deltaTime);
    });
}

var drawBoxSprite = function(sprite){
    if(!sprite.active){
        return;
    }
    context.save();
    context.translate(sprite.positionX, sprite.positionY);
    context.rotate(sprite.rotation - (tao/4));//start rotation from the positive y axis
    context.fillStyle = sprite.color;
    context.fillRect(
        - (sprite.width/2),
        - (sprite.height/2),
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

    emitters.forEach(emitter => {
        emitter.sprites.forEach(sprite => {
            drawBoxSprite(sprite);
        });
    });


    onUpdate(deltaTime);
}

var createEmitter = function(
    positionX = canvasWidth / 2,
    positionY = canvasHeight / 2,
    interval = 500,
    particleConfig = {}
){
    var emitter = new Emitter(positionX,positionY);
    emitters.push(emitter);
    setInterval(
        () => {
            emitter.emit(
                particleWidth = particleConfig.particleWidth || 40,
                particleHeight = particleConfig.particleHeight || 20,
                particleColor = particleConfig.particleColor || '#FFF',
                speed = particleConfig.speed || 100
            );
        }, 
        interval = 500
    );
}

var createEmitters = function(configurations) {
    configurations.forEach(config => {
        createEmitter(config.positionX, config.positionY, config.interval,config.particleConfig);
    });
}

var onInitialize = function(config = {}){
    emitters.length = 0;// Empty the array
    createEmitters(config.emitters || []);
}

var emitterConfig = {
    emitters: [
        { positionX: canvasWidth / 2, positionY: canvasHeight / 2, interval: 500 },
        {
            positionX: 100,
            positionY: 100,
            interval: 300,
            particleConfig: {
                particleWidth: 25,
                particleHeight: 15,
                particleColor: '#00FF00',
                speed: 80
            }
        },
        {
            positionX: (canvasWidth) - 100,
            positionY: (canvasHeight) - 100,
            interval: 400,
            particleConfig: {
                particleWidth: 20,
                particleHeight: 10,
                particleColor: '#0000FF',
                speed: 80
            }
        },
        {
            positionX: (canvasWidth) - 100,
            positionY: 100,
            interval: 400,
            particleConfig: {
                particleWidth: 15,
                particleHeight: 5,
                particleColor: '#FF0000',
                speed: 80
            }
        },
        {
            positionX: 100,
            positionY: (canvasHeight) - 100,
            interval: 400,
            particleConfig: {
                particleWidth: 10,
                particleHeight: 30,
                particleColor: '#FF00FF',
                speed: 80
            }
        }
    ]
};

onInitialize(emitterConfig);

requestAnimationFrame(vsyncLoop);

/*
const { createApp, ref } = Vue

createApp({
    setup() {
        const brickHeight = ref(20)
        const brickWidth = ref(80)//observability, update template dependant on it.
        const ballSize = ref(40)
        const submitForm = function () {
            onInitialize({
                brickHeight : brickHeight.value,
                brickWidth : brickWidth.value,
                ballSize : ballSize.value
            });
        }
        return {
            brickHeight,
            brickWidth,
            ballSize,
            submitForm
        }
    }
}).mount('#app')*/