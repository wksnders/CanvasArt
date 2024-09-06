
const { createApp , ref , onMounted , onUnmounted } = Vue

const tao = 2 * Math.PI;

//set up canvas
var canvas = document.getElementById('display-canvas'); 
var canvasWidth = ref(canvas.width);
var canvasHeight = ref(canvas.height);
var context = canvas.getContext('2d');

var boidProperties = ref({
    visualRange: 400,
    protectedRange: 80,
    centeringFactor: 0.0005,
    avoidFactor: 0.05,
    matchingFactor: 0.05,
    maxSpeed: 120,
    minSpeed: 60,
});

var isAnimationActive = true;
var sprites = [];
var boids = [];
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
        this.position = glMatrix.vec2.fromValues(positionX,positionY);
        this.rotation = rotation;
        this.width = width;
        this.height = height;
        this.velocity = glMatrix.vec2.fromValues(velocityX,velocityY);
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

class Boid{
    //maxSpeed
    //minSpeed

    static isInRange(boid,otherSprite,Range){
        //TODO make a better distance calc that accounts for sprite size
        var dist = glMatrix.vec2.dist(boid.position,otherSprite.position);
        return dist < Range;
    }

    static seperation(boids, sprites, avoidFactor,boidSeperationRange){

        boids.forEach((boid) => {
            var avoidVector = glMatrix.vec2.create();

            sprites.filter(
                (sprite) => Boid.isInRange(
                    boid,
                    sprite, 
                    boidSeperationRange
                )
            ).forEach((tooCloseSprites) => {
                avoidVector[0] += boid.position[0] - tooCloseSprites.position[0];
                avoidVector[1] += boid.position[1] - tooCloseSprites.position[1];
            });

            glMatrix.vec2.scaleAndAdd(boid.velocity,boid.velocity,avoidVector,avoidFactor);
        });
    }
    static alignment(boids,visibleRange,matchingFactor){
        //TODO restrict to visible range
        boids.forEach((boid) => {
            var numVisibleBoids = 0;
            var alignVector = glMatrix.vec2.create();

            boids.filter((otherBoid) => {
                Boid.isInRange(
                    boid,
                    otherBoid,
                    visibleRange
                )
            }).forEach((visibleBoid) => {
                numVisibleBoids += 1;
                alignVector[0] += visibleBoid.velocity[0];
                alignVector[1] += visibleBoid.velocity[1];
            });
            var avgVelocity = glMatrix.vec2.create();
            if(numVisibleBoids > 0){
                glMatrix.vec2.scale(
                    avgVelocity,
                    (1/numVisibleBoids),
                    alignVector
                );
            }

            var combinedVelocity = glMatrix.vec2.create();
            glMatrix.vec2.sub(
                combinedVelocity,
                avgVelocity,
                boid.velocity
            );

            glMatrix.vec2.scaleAndAdd(boid.velocity,boid.velocity,combinedVelocity,matchingFactor);
            
        });
        
        
    }
    static cohesion(boids,visibleRange,centeringFactor){
        boids.forEach((boid) => {
            var numVisibleBoids = 0;
            var cohesionVector = glMatrix.vec2.create();

            boids.filter((otherBoid) => {
                Boid.isInRange(
                    boid,
                    otherBoid,
                    visibleRange
                )
            }).forEach((visibleBoid) => {
                numVisibleBoids += 1;
                cohesionVector[0] += visibleBoid.position[0];
                cohesionVector[1] += visibleBoid.position[1];
            });
            var avgPosition = glMatrix.vec2.create();
            if(numVisibleBoids > 0){
                glMatrix.vec2.scale(
                    avgPosition,
                    (1/numVisibleBoids),
                    cohesionVector
                );
            }

            var combinedPosition = glMatrix.vec2.create();
            glMatrix.vec2.sub(
                combinedPosition,
                avgPosition,
                boid.position
            );

            glMatrix.vec2.scaleAndAdd(boid.velocity,boid.velocity,combinedPosition,centeringFactor);
            
        });

    }
    static screenWrapAndMirror(boid){
        if (boid.position[0] < 0) {
            boid.position[0] = canvasWidth.value - 1; 
            boid.position[1] = canvasHeight.value - boid.position[1];
        } else if (boid.position[0] > canvasWidth.value) {
            boid.position[0] = 1; 
            boid.position[1] = canvasHeight.value - boid.position[1]; 
        }

        if (boid.position[1] < 0) {
            boid.position[1] = canvasHeight.value - 1;
            boid.position[0] = canvasWidth.value - boid.position[0];
        } else if (boid.position[1] > canvasHeight.value) {
            boid.position[1] = 1;
            boid.position[0] = canvasWidth.value - boid.position[0];
        } 
    }

    static speedLimits(boid,maxSpeed,minSpeed){
        var speed = glMatrix.vec2.len(boid.velocity);
        if(speed > maxSpeed){
            glMatrix.vec2.scale(
                boid.velocity,
                boid.velocity,
                maxSpeed/speed
            );
        }
        else if(speed < minSpeed){
            glMatrix.vec2.scale(
                boid.velocity,
                boid.velocity,
                minSpeed/speed
            );
        }
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
    //screen wrap on boids
    Boid.seperation(
        boids,
        sprites,
        boidProperties.value.avoidFactor,
        boidProperties.value.protectedRange
    );
    Boid.alignment(
        boids,
        boidProperties.value.visualRange,
        boidProperties.value.matchingFactor
    );
    Boid.cohesion(
        boids,
        boidProperties.value.visualRange,
        boidProperties.value.centeringFactor
    );
    boids.forEach((boid)=>{
        Boid.speedLimits(
            boid,
            boidProperties.value.maxSpeed,
            boidProperties.value.minSpeed
        );
    });
    boids.forEach(Boid.screenWrapAndMirror);
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
        function addBoid(){
            const newboid = new Sprite(
                sprites.length, // TODO: Implement a new ID system
                15,
                15,
                '#228822',
                canvasWidth.value/2,
                canvasHeight.value/2,
                0,
                30,
                0,
                0
            );
            sprites.push(newboid);
            boids.push(newboid);
        }
        function removeEmitter(emitter) {
            emitters.value = emitters.value.filter((t) => t !== emitter);
        }
        function submitForm() {
            onInitialize(emitters.value);
        }
        return {//html is allowed to know about
            addBoid,
            boidProperties,
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