const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas width and height based on the window size or fixed size
canvas.width = window.innerWidth * 0.8; // 80% of the window width
canvas.height = window.innerHeight * 0.8; // 80% of the window height


class Blob {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = 0;
        this.dy = 0;
    }
    
    draw() { //function called draw, used in subclasses to draw the circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); //draw circle. 2pi raidans. math :)
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Player extends Blob {
    constructor(x, y, radius, color) {
        super(x, y, radius, color);
        this.speed = 2;
    }
    shoot(mouseX, mouseY, ammoType) {
        let recoilPower = 6; // Default recoil for regular ammo
        let projectileSpeed = 8; // Default speed for regular ammo
        const angle = Math.atan2(mouseY-this.y, mouseX-this.x); //polar coordinates and unit circle thingy
        
        if (ammoType === 0 && reg_ammo > 0) {
            reg_ammo -= 1;
        
        } else if (ammoType === 1) {
            projectileSpeed = 21; // Faster projectiles
            recoilPower = -20; // Higher recoil
            travel_ammo -= 1; // Decrease count
        
        } else if (ammoType === 2) {
            //no recoil
            projectileSpeed = 4; // Slower projectiles
            bomb_count -= 1; // Decrease count
            bombs.push(new Bomb(this.x, this.y, 5, 'black', angle, projectileSpeed));
            return;
        } else if (ammoType === 3) {
            //no recoil
            gravity_well_count -= 1; // Decrease count
            gravitywells.push(new GravityWell(mouseX, mouseY, 5, 'cyan', 15, 0));
            return;
        } else if (ammoType === 4) {
            //no recoil
            reverse_gravity_well_count -= 1; // Decrease count
            gravitywells.push(new GravityWell(mouseX, mouseY, 5, 'red', 15, 1));
            return;
        } else {
            return;
        
        }
        projectiles.push(new Projectile(this.x, this.y, 5, ammoType === 0 ? 'white' : 'blue', angle, projectileSpeed));
        //Polar Coordinates (cos, sin) of the angle in which the projectile is from the player.
        this.dx -= Math.cos(angle) * recoilPower;
        this.dy -= Math.sin(angle) * recoilPower;

    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.dx *= 0.9;
        this.dy *= 0.9;
        this.draw();
    }
}

class Projectile extends Blob {
    constructor(x, y, radius, color, angle, speed) {
        super(x, y, radius, color);
        this.speed = speed
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.draw();
    } 
}

class Bomb extends Blob {
    constructor(x, y, radius, color, angle, speed) {
        super(x, y, radius, color);
        this.dx = Math.cos(angle) * speed;
        this.dy = Math.sin(angle) * speed;
        this.startTime = performance.now(); // Time of bomb creation
        this.exploding = false;
        this.explosionRadius = 0; // Explosion starts at 0
        this.maxExplosionRadius = 100; // Max explosion size
    }

    update(timestamp) {
        if (!this.exploding) {
            // Move the bomb
            this.x += this.dx;
            this.y += this.dy;

            // Bounce off canvas edges
            if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
                this.dx *= -1;
            }
            if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
                this.dy *= -1;
            }

            // Start explosion after 2 seconds
            if (timestamp - this.startTime > 5000) {
                this.exploding = true;
                this.radius = 0; // Shrink the visual
            }
        } else {
            // Handle explosion logic
            if (this.explosionRadius < this.maxExplosionRadius) {
                this.explosionRadius += 5; // Expand explosion
            } else {
                // Remove bomb after explosion finishes
                bombs.splice(bombs.indexOf(this), 1);
                return;
            }

            // Check for enemies in explosion radius

            enemies = enemies.filter((enemy) => {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            
            if (dist < this.explosionRadius) {
                dropAmmo(enemy.x, enemy.y, timestamp); // Drop ammo for eliminated enemy
                return false; // Remove enemy from array
            }
            return true; // Keep enemy in array
            });

        }

        this.draw();
    }

    draw() {
        if (this.exploding) {
            // Draw explosion
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explosionRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        } else {
            // Draw bomb
            super.draw();
        }
    }
}


class GravityWell extends Blob {
    constructor(x, y, radius, color, strength, type) {
        super(x, y, radius, color);
        this.strength = strength; // Strength of gravitational pull
        this.startTime = performance.now(); // Creation time
        this.type = type
    }

    applyForce(entity) {
        // Calculate the distance and angle to the entity
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        //calculate push/pull strength
        const pullStrength = Math.min(this.strength / Math.max(distance, 10), this.strength);

        // Apply the force to the entity's velocity
        if (this.type === 0) {
            entity.dx += Math.cos(angle) * pullStrength;
            entity.dy += Math.sin(angle) * pullStrength;
        } else {
            entity.dx -= Math.cos(angle) * pullStrength;
            entity.dy -= Math.sin(angle) * pullStrength;
        }
    }

    update(timestamp) {
        // Check if the well has expired
        if (timestamp - this.startTime > 10000) {
            gravitywells.splice(gravitywells.indexOf(this), 1); // Remove expired well
            
            return true;
        
        } else {
            // Draw the well
            this.draw();

            return false;
        
        }

    }
}

class Enemy extends Blob {
    constructor(x, y, radius, color, speed) {
        super(x, y, radius, color);
        this.speed = speed;

    }
    update(playerX, playerY) {
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
        

        // Apply gravity well forces
        gravitywells.forEach((well) => {
            well.applyForce(this); // Apply gravity well force to this enemy  
        });
        
        this.x += this.dx;
        this.y += this.dy;
        this.draw();

    }
}

class FloorAmmo extends Blob {
    constructor(x, y, radius, color, type, timestamp) {
        super(x, y, radius, color);
        this.type = type;
        this.starterTime = timestamp;
        this.timeAlive = 0;

        this.dx, this.dy = 0, 0;
    }
    update(timestamp) {
        this.timeAlive = timestamp-this.starterTime;
        
        //accounting for gravity wells
        this.dy *= 0.9;
        this.dx *= 0.9;

        this.x += this.dx;
        this.y += this.dy;
        
        this.draw();
    }
}

// game/session variables
// Check if a user ID exists in localStorage, else generate one
let userId = localStorage.getItem("userId");
if (!userId) {
    userId = crypto.randomUUID(); // Generate a unique ID
    localStorage.setItem("userId", userId);
}
console.log("User ID:", userId);

//PROMPT USERNAME

let highscore = localStorage.getItem('highscore');

if (highscore) {
    highscore = Number(highscore);
} else {
    highscore = 0;
    localStorage.setItem("highscore", highscore.toString());
}



let player = new Player(canvas.width / 2, canvas.height /2, 20, 'lightblue');
let projectiles = [];
let bombs = [];
let gravitywells = [];
let enemies = [];
let spawnInterval = 2000;
let bossInterval = 50000;
let lastSpawn = 0;
let lastBoss = 0;
let difficulty = 0;
let score = 0;
let reg_ammo = 20;
let travel_ammo = 3;
let bomb_count = 2;
let gravity_well_count = 1;
let reverse_gravity_well_count = 1;
let on_ground_ammo = [];
let selectedAmmo = 0;

// Mouse event listener for shooting
// Track if the spacebar is pressed
let isOnePressed = false;
let isTwoPressed = false;
let isThreePressed = false;
let isFourPressed = false;

window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit1') {
        isOnePressed = true; 
    }
});


window.addEventListener('keyup', (e) => {
    if (e.code === 'Digit1') {
        isOnePressed = false; 
    }
});


window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit2') {
        isTwoPressed = true; 
    }
});


window.addEventListener('keyup', (e) => {
    if (e.code === 'Digit2') {
        isTwoPressed = false; 
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit3') {
        isThreePressed = true; 
    }
});


window.addEventListener('keyup', (e) => {
    if (e.code === 'Digit3') {
        isThreePressed = false; 
    }
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Digit4') {
        isFourPressed = true; 
    }
});


window.addEventListener('keyup', (e) => {
    if (e.code === 'Digit4') {
        isFourPressed = false; 
    }
});

let noShoot = false;

// Mouse event listener for shooting
window.addEventListener('mousedown', (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    if (noShoot === true){
        // Determine which ammo to shoot
        if (isOnePressed && travel_ammo > 0) {
            // 1 key is pressed -> Shoot Travel Ammo
            player.shoot(mouseX, mouseY, 1); 
        } else if (isTwoPressed && bomb_count > 0) {
            // 2 key is pressed -> Shoot Bomb
            player.shoot(mouseX, mouseY, 2); 
        } else if (isThreePressed && gravity_well_count > 0) {
            // 3 key is pressed -> Gravity Well
            player.shoot(mouseX, mouseY, 3)
        } else if (isFourPressed && reverse_gravity_well_count > 0) {
            // 3 key is pressed -> Reverse Gravity Well
            player.shoot(mouseX, mouseY, 4); 
        } else if (reg_ammo > 0) {
            // Default -> Shoot Regular Ammo
            player.shoot(mouseX, mouseY, 0); 
        }
    }
});



function spawnEnemy() {
    
    const radius = Math.random() * 20 + 10;
    let x, y;

    if (Math.random() > 0.5) { //spawn on sides
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius; //either far left or far right
        y = Math.random() * canvas.height;

    } else { // spawn on top
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }
    const color = `hsl(${Math.random()*360}, 50%, 50%)`;
    const speed = Math.random() * 1.5 + 0.5;
    enemies.push(new Enemy(x, y, radius, color, speed));

}

function dropAmmo(enemyX, enemyY, timestamp) {
    const dropCount = Math.floor(Math.random() * 3) + 4; // Randomly drop between 4 and 6 items
    for (let i = 0; i < dropCount; i++) {
        const offsetX = Math.random() * 30 - 15; // Randomize ammo spread
        const offsetY = Math.random() * 30 - 15;

        // Randomly choose ammo type (0: RegularAmmo, 1: TravelAmmo, 2: BombAmmo, 3: GravityWell)
        const rand = Math.random();
        let ammoType;
        let ammoColor;

        if (rand < 0.7) {
            ammoType = 0; // 70% chance for RegularAmmo
            ammoColor = 'yellow';
        } else if (rand < 0.85) {
            ammoType = 1; // 15% chance for TravelAmmo
            ammoColor = 'purple';
        } else if (rand < 0.925) {
            ammoType = 2; // 7.25% chance for BombAmmo
            ammoColor = 'black';
        } else if (rand < 0.975) {
            ammoType = 3; // 5% chance for GravityWell
            ammoColor = 'cyan'; 
        } else {
            ammoType = 4;
            ammoColor = 'red';
        }

        const ammo = new FloorAmmo(enemyX + offsetX, enemyY + offsetY, 5, ammoColor, ammoType, timestamp);

        
        // Add the ammo to the ground
        on_ground_ammo.push(ammo);
    }
}



function updateHighscore(newScore) {
    console.log(newScore, highscore);
    if (newScore > highscore) {
        highscore = newScore;

        // Update high score in localStorage
        localStorage.setItem("highscore", highscore.toString());
        console.log("New high score:", highscore);
        const savedName = localStorage.getItem("userName").toString();
        // Send updated score to backend
        const playerData = {
            id: userId,
            name:  savedName, 
            score: highscore
        };

        try {
            JSON.stringify(playerData);
        } catch (error) {
            console.error("Invalid JSON format:", error);
        }
        console.log(playerData);

        // POST the player data to the backend
        return fetch('https://brownhujay.pythonanywhere.com/scoreboard/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        })
        .then(response => response.json())
        .then(data => {
            console.log("High score updated on backend:", data);
        })
        .catch(error => {
            console.error("Error updating high score:", error);
        });
    }
}




function reset() {
    //update leaderboard with highscore
    updateHighscore(score);
    difficulty = 0;
    lastBoss = 0;
    enemies = [];
    projectiles = [];
    on_ground_ammo = [];
    bombs = [];
    gravitywells = []
    selectedAmmo = 0;
    score = 0;
    reg_ammo = 20;
    travel_ammo = 3;
    bomb_count = 2;
    gravity_well_count = 1;
    reverse_gravity_well_count = 1;
}

function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('regAmmoCount').textContent = reg_ammo;
    document.getElementById('travelAmmoCount').textContent = travel_ammo;
    document.getElementById('sChargeCount').textContent = bomb_count;
    document.getElementById('wellCount').textContent = gravity_well_count;
    document.getElementById('revWellCount').textContent = reverse_gravity_well_count;

    document.getElementById("highscore").textContent = highscore;

    if (
        (player.x + player.radius) > canvas.width || (player.x - player.radius) < 0
    ) {
        // Collision with vertical walls
        player.dx *= -2; // Reverse horizontal velocity
    } 
    
    if (
        (player.y + player.radius) > canvas.height || (player.y - player.radius) < 0
    ) {
        // Collision with horizontal walls
        player.dy *= -2; // Reverse vertical velocity
    }
    

    if (timestamp - lastSpawn > spawnInterval){
        spawnEnemy();
        lastSpawn = timestamp;
        if (timestamp - lastBoss > bossInterval) {
            for(let i = 0; i<(3+difficulty); i++) {
                spawnEnemy();
            }
            lastBoss = timestamp;
            difficulty += 1;
        }
    }


    projectiles.forEach((projectile, index) => {
        projectile.update();
        if (
            projectile.x < 0 || projectile.x > canvas.width || 
            projectile.y < 0 || projectile.y > canvas.height
        ) {
            projectiles.splice(index, 1); //remove projectiles if out of bounds
        }
    });
    

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update(player.x, player.y); // chase player
        
        //check colision
        const distToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        
        if (distToPlayer - enemy.radius - player.radius < 0) {
            console.log("resetting")
            reset()

            document.getElementById("scoreboard").textContent = score;
            player = new Player(canvas.width/2, canvas.height/2, 20, 'lightblue');
            return;
        }
        

        projectiles.forEach((projectile, projIndex) => {
            const distToProjectile = Math.hypot(projectile.x - enemy.x, projectile.y-enemy.y);
            if (distToProjectile - enemy.radius - projectile.radius < 0) {
                setTimeout(() => { //timeout to not break the code & stuff
                    score += 1;
                    
                    document.getElementById("scoreboard").textContent = score; // Update scoreboard, changing html rather than javascript variable.
                    
                    projectiles.splice(projIndex, 1); //remove particle
                    enemies.splice(enemyIndex, 1); //remove enemy 
                    
                    dropAmmo(enemy.x, enemy.y, timestamp)//drop ammo
                }, 0);
            }
        });
    });

        // Apply gravity wells to all entities
    gravitywells.forEach((well) => {
        if (well.update(timestamp) === false) {  
            
            [...projectiles, ...bombs, ...enemies, ...on_ground_ammo].forEach((entity) => {
                well.applyForce(entity);
            }); 
        }
    });
    
    bombs.forEach((bomb) => bomb.update(timestamp)); //small loop for bombs

    on_ground_ammo.forEach((ammo, index) => {
        ammo.update(timestamp); // Draw ammo
        
        if (ammo.timeAlive > 30000){
            on_ground_ammo.splice(index, 1);
        }
        const distToPlayer = Math.hypot(player.x - ammo.x, player.y - ammo.y);
        if (distToPlayer - ammo.radius - player.radius < 0) {
            if (ammo.type === 0) {
                reg_ammo += 1; // Regular ammo
            } else if (ammo.type === 1) {
                travel_ammo += 1; // Travel ammo
            } else if (ammo.type === 2) {
                bomb_count += 1; // Bombs
            } else if (ammo.type === 3) {
                gravity_well_count += 1; // Gravity wells
            } else if (ammo.type === 4) {
                reverse_gravity_well_count += 1; // Gravity wells
            }
            on_ground_ammo.splice(index, 1); // Remove the ammo after pickup
        }
    });
    //update and draw player
    player.update();

    //redraw
    requestAnimationFrame(gameLoop);
}
// Get the input field, button, and display elements
const nameInput = document.getElementById('personName');
const button = document.getElementById('getNameButton');
const displayName = document.getElementById('displayName');

// Check local storage for a saved name
const savedName = localStorage.getItem("userName");
console.log(savedName);

if (savedName) {
    // If name exists, display it and disable the button
    displayName.textContent = `Welcome back, ${savedName}!`;
    button.disabled = true;
    nameInput.value = savedName; // Prefill the input with the saved name
    
    requestAnimationFrame(gameLoop);
    noShoot = true;
    

} else {
    // If no name exists, enable the button
    button.disabled = false;
}

// Add a click event to the button
button.addEventListener('click', () => {
    // Get the value from the input field
    let name = nameInput.value.trim();

    if (name) {
        // Save the name to local storage
        localStorage.setItem("userName", name);

        // Display the name and start the game
        displayName.textContent = `Hello, ${name}!`;
        console.log("Username:", name);
        playerName = name;
        
        
        // Disable the button after saving
        button.disabled = true;

        requestAnimationFrame(gameLoop);
        noShoot = true;
    } else {
        displayName.textContent = `Please enter a valid name.`;
    }
});