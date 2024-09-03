
const { createApp , ref , onMounted , onUnmounted } = Vue

const tao = 2 * Math.PI;

//set up canvas
var canvas = document.getElementById('display-canvas'); 
var canvasWidth = ref(canvas.width);
var canvasHeight = ref(canvas.height);
var context = canvas.getContext('2d');

var isAnimationActive = true;
var sprites = [];
let emitterId = 0;
const emitters = ref([
    { 
        id: emitterId++,
        positionX: canvasWidth.value / 2, 
        positionY: canvasHeight.value / 2, 
        interval: 500 ,
        timeTillNextParticle:100,
        particleWidth: 25,
        particleHeight: 15,
        particleColor: '#00FF00',
        particleSpeed: 80
    },
    {
        id: emitterId++,
        positionX: 100,
        positionY: 100,
        interval: 300,
        timeTillNextParticle:100,
        particleWidth: 25,
        particleHeight: 15,
        particleColor: '#00FF00',
        particleSpeed: 80
    },
    {
        id: emitterId++,
        positionX: (canvasWidth.value) - 100,
        positionY: (canvasHeight.value) - 100,
        interval: 400,
        timeTillNextParticle:100,
        particleWidth: 20,
        particleHeight: 10,
        particleColor: '#0000FF',
        particleSpeed: 80
    },
    {
        id: emitterId++,
        positionX: (canvasWidth.value) - 100,
        positionY: 100,
        interval: 400,
        timeTillNextParticle:100,
        particleWidth: 15,
        particleHeight: 5,
        particleColor: '#FF0000',
        particleSpeed: 80
    },
    {
        id: emitterId++,
        positionX: 100,
        positionY: (canvasHeight.value) - 100,
        interval: 400,
        timeTillNextParticle:100,
        particleWidth: 10,
        particleHeight: 30,
        particleColor: '#FF00FF',
        particleSpeed: 80
    }
]);

//represents a sprite to be rendered on screen
class Sprite {
    constructor(id,width,height,color = '#FFF', positionX = 0, positionY = 0,rotation = 0, velocityX = 0, velocityY = 0,angVel = 0) {
        this.id = id;
        this.active = true;
        this.position = glMatrix.vec2.create();
        glMatrix.vec2.set(this.position,positionX,positionY);
        this.rotation = rotation;
        this.width = width;
        this.height = height;
        this.velocity = glMatrix.vec2.create();
        glMatrix.vec2.set(this.velocity,velocityX,velocityY);
        this.angVel = angVel;
        this.color = color;
    }
    setActive(active){
        this.active = active;
    }
    setPosition(position){
        glMatrix.vec2.copy(this.position,position);
    }
    setVelocity(velocityX,velocityY){
        glMatrix.vec2.set(this.velocity,velocityX,velocityY);
    }
    setRotation(rotation){
        this.rotation = rotation;
    }
    setSize(height,width){
        this.height = height;
        this.width = width;
    }
    update(deltaTime){
        var scaledVelocity = glMatrix.vec2.create();
        glMatrix.vec2.scale(scaledVelocity,this.velocity,deltaTime);
        glMatrix.vec2.add(
            this.position,
            this.position,
            scaledVelocity
        );
        if(this.angVel != 0){
            this.setRotation(
                this.rotation + (this.angVel * deltaTime)
            );
        }
    }
}

class Emitter {
    static emit(
        emitterX,
        emitterY,
        particleWidth = 40,
        particleHeight = 20,
        particleColor = '#FFF',
        particleSpeed = 100,
        angle = Math.random() * tao,
        rotationSpeed = 0
    ) {
        // Calculate velocity components based on angle
        const velocityX = Math.cos(angle) * particleSpeed;
        const velocityY = Math.sin(angle) * particleSpeed;

        // Create a new sprite with velocity
        const newSprite = new Sprite(
            sprites.length, // TODO: Implement a new ID system
            particleWidth,
            particleHeight,
            particleColor,
            emitterX,
            emitterY,
            angle,
            velocityX,
            velocityY,
            rotationSpeed
        );

        console.info('Emitter emit : emitterX', emitterX, 'emitterY', emitterY);

        sprites.push(newSprite);
    }

    static update(emitter,deltaTime) {
        var {timeTillNextParticle,
            positionX,
            positionY,
            interval,
            particleWidth,
            particleHeight,
            particleColor,
            particleSpeed
        } = emitter;
        if(timeTillNextParticle <= 0){
            Emitter.emit(
                positionX,
                positionY,
                particleWidth,
                particleHeight,
                particleColor,
                particleSpeed
            );
            emitter.timeTillNextParticle = interval;
        }
        emitter.timeTillNextParticle --;
    }
}



var onUpdate = function(deltaTime){
    if(!isAnimationActive){
        return;
    }

    emitters.value.forEach(emitter => {
        Emitter.update(emitter,deltaTime);
    });
    //TODO move emmiters to be on screen if not on screen

    sprites.forEach(sprite => {
        sprite.update(deltaTime);
    });
    //remove offscreen sprites
    sprites = sprites.filter(sprite => {
        return sprite.position[0] > 0 && sprite.position[0] < canvasWidth.value &&
               sprite.position[1] > 0 && sprite.position[1] < canvasHeight.value;
    });

}

var drawBoxSprite = function(sprite){
    if(!sprite.active){
        return;
    }
    context.save();
    context.translate(sprite.position[0], sprite.position[1]);
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
    //console.log('vsyncLoop : deltaTime',deltaTime);

    
    //Clear old content
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvasWidth.value, canvasHeight.value);
    sprites.forEach(sprite => {
        drawBoxSprite(sprite);
    });


    onUpdate(deltaTime);
}

requestAnimationFrame(vsyncLoop);

createApp({
    setup() {
        onMounted(()=> {
            window.addEventListener("resize", handleResize);
            handleResize();
        });
        onUnmounted(()=> {
            window.removeEventListener("resize", handleResize);
        });

        var handleResize = function(){
            console.log('handleResize : resized width',document.documentElement.clientWidth);
            var containerWidth = document.querySelector('.container').clientWidth;
            var canvas = document.querySelector('#display-canvas');
            canvasWidth.value  = containerWidth * 0.8;
            canvas.width = canvasWidth.value;
            canvasHeight.value = containerWidth * 0.6;
            canvas.height = canvasHeight.value;
            //todo loop through emitters and update max xand y pos
        }
        function addEmitter() {
            emitters.value.push({ 
                id: emitterId++,
                positionX:  100,
                positionY: 100,
                interval: 300,
                timeTillNextParticle:100,
                particleWidth: 25,
                particleHeight: 15,
                particleColor: '#00FF00',
                particleSpeed: 80
            });
        }
        function removeEmitter(emitter) {
            emitters.value = emitters.value.filter((t) => t !== emitter);
        }
        function submitForm() {
            onInitialize(emitters.value);
        }
        return {//html is allowed to know about
            canvasHeight,
            canvasWidth,
            emitters,
            addEmitter,
            removeEmitter,
            submitForm,
            handleResize
        }
    }
}).mount('#app')