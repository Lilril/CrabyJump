const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");
canvas.width = 400;
canvas.height = 600;

const gameOverSound = new Audio("assets/bruh.mp3");
const backgroundMusic = new Audio("assets/sky.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const bgImage = new Image();
bgImage.src = "assets/road.png";

const platformImage = new Image();
platformImage.src = "assets/prove.png";

const playerImage = new Image();
playerImage.src = "assets/crab.png";

const monsterImage = new Image();
monsterImage.src = "assets/monster.png";

let player, platforms, score, bestScore = 0, gameRunning = false, gameOver = false;
const gravity = 0.2;
const jumpPower = -7;
const monsterJumpPower = jumpPower * 2;

let playerDirection = 1;
let bullets = [];
let monster = null;
let monsterRespawnTimer = null;

function resetGame() {
    player = { x: 200, y: 300, width: 50, height: 50, dy: 0, dx: 0, onPlatform: false };
    platforms = [];
    score = 0;
    gameRunning = true;
    gameOver = false;
    bullets = [];

    for (let i = 0; i < 10; i++) {
        platforms.push({
            x: Math.random() * 350,
            y: i * 60,
            width: 80,
            height: 10,
            scored: false,
            wasOnPlatform: false
        });
    }

    spawnMonster();
    document.getElementById("current-score").textContent = `Score: ${score}`;
    document.getElementById("best-score").textContent = `Best: ${bestScore}`;

    backgroundMusic.play().catch(error => {});
    
    gameLoop();
}

function spawnMonster() {
    let validPlatforms = platforms.filter(p => p.y < player.y - 100);

    if (validPlatforms.length > 0) {
        const randomPlatform = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
        monster = {
            platform: randomPlatform,
            x: randomPlatform.x + (randomPlatform.width / 2) - 25,
            y: randomPlatform.y - 50,
            width: 50,
            height: 50
        };
    }
}

function startRespawnTimer() {
    if (monsterRespawnTimer) {
        clearTimeout(monsterRespawnTimer);
    }

    const respawnTime = Math.random() * 5000 + 5000;

    monsterRespawnTimer = setTimeout(() => {
        spawnMonster();
    }, respawnTime);
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
        player.dx = -4;
        playerDirection = -1; 
    }
    if (e.key === "ArrowRight") {
        player.dx = 4;
        playerDirection = 1;
    }
    if (e.key === "ArrowUp") {
        shootBullet(); 
    }

    if (e.key === " " && gameOver) {
        resetGame();
    }
});

document.addEventListener("keyup", () => {
    player.dx = 0;
});

function shootBullet() {

    const bullet = {
        x: player.x + player.width / 2 - 5,
        y: player.y,
        width: 5,
        height: 25,
        speed: 5,
    };
    bullets.push(bullet);
}

function update() {
    if (!gameRunning) return;

    player.dy += gravity;
    player.y += player.dy;
    player.x += player.dx;

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;

        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }

        if (monster &&
            bullet.x < monster.x + monster.width &&
            bullet.x + bullet.width > monster.x &&
            bullet.y < monster.y + monster.height &&
            bullet.y + bullet.height > monster.y
        ) {
            monster = null;
            score += 3;
            document.getElementById("current-score").textContent = `Score: ${score}`;
            document.getElementById("best-score").textContent = `Best: ${bestScore}`;

            startRespawnTimer();

            bullets.splice(index, 1);
        }
    });

    if (player.x + player.width < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.width;

    let isTouchingPlatform = false;

    platforms.forEach((platform) => {
        if (
            player.dy > 0 &&
            player.y + player.height > platform.y &&
            player.y + player.height < platform.y + platform.height &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width
        ) {
            player.dy = 0;
            player.y = platform.y - player.height;
            isTouchingPlatform = true;

            if (!platform.scored && !platform.wasOnPlatform) {
                platform.scored = true;
                score += 1;
                document.getElementById("current-score").textContent = `Score: ${score}`;
                document.getElementById("best-score").textContent = `Best: ${bestScore}`;
            }

            platform.wasOnPlatform = true;

            if (!player.onPlatform) {
                player.dy = jumpPower;
                player.onPlatform = true;
            }
        }
    });

    if (!isTouchingPlatform) {
        platforms.forEach((platform) => platform.wasOnPlatform = false);
        player.onPlatform = false;
    }

    if (player.y < 250) {
        player.y = 250;
        platforms.forEach((platform) => {
            platform.y += -player.dy;
            if (platform.y > canvas.height) {
                platform.y = 0;
                platform.x = Math.random() * 350;
                platform.scored = false;

                if (monster && monster.platform === platform) {
                    monster = null;
                    startRespawnTimer();
                }
            }
        });
    }

    if (player.y > canvas.height) {
        endGame();
    }

    if (monster) {
        monster.x = monster.platform.x + (monster.platform.width / 2) - (monster.width / 2);
        monster.y = monster.platform.y - 50;
    }

    if (monster &&
        player.x < monster.x + monster.width &&
        player.x + player.width > monster.x &&
        player.y < monster.y + monster.height &&
        player.y + player.height > monster.y
    ) {
        if (player.dy > 0 && player.y + player.height <= monster.y + 10) {
            player.dy = monsterJumpPower;
            monster = null;
            score += 3;
            document.getElementById("current-score").textContent = `Score: ${score}`;
            document.getElementById("best-score").textContent = `Best: ${bestScore}`;

            startRespawnTimer();
        } else {
            endGame();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    if (!playerImage.complete) {
        console.log("Image is not uploaded");
        return;
    }

    ctx.save();

    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    ctx.scale(playerDirection, 1);

    ctx.drawImage(playerImage, -player.width / 2, -player.height / 2, player.width, player.height);

    ctx.restore();

    bullets.forEach((bullet) => {
        ctx.fillStyle = "#ff57e9";
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    platforms.forEach((platform) => {
        drawRoundedPlatform(platform.x, platform.y, platform.width, platform.height);
    });

    if (monster) {
        ctx.drawImage(monsterImage, monster.x, monster.y, monster.width, monster.height);
    }

    if (gameOver) {
        drawGameOverScreen();
    }
}

function drawBackground() {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
}

function drawRoundedPlatform(x, y, width, height) {
    const radius = width * 0.08;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(platformImage, x, y, width, height);
    ctx.restore();
}

function drawGameOverScreen() {
    const gameOverImage = new Image();
    gameOverImage.src = "assets/over.png";

    gameOverImage.onload = function () {
        ctx.drawImage(gameOverImage, (canvas.width - gameOverImage.width) / 2, (canvas.height - gameOverImage.height) / 2);
    };
}


function gameLoop() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    gameOver = true;
    bestScore = Math.max(bestScore, score);
    
    document.getElementById("best-score").textContent = `Best: ${bestScore}`;
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    gameOverSound.play();
}

window.onload = () => {
    resetGame();
};
