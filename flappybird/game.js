/* ═══════════════════════════════════════════════════
   Flappy Bird – Complete Game Engine
   Canvas-based with procedural graphics
   ═══════════════════════════════════════════════════ */

(() => {
    "use strict";

    // ── Canvas Setup ──
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const W = 420;
    const H = 680;
    canvas.width = W;
    canvas.height = H;

    // ── DOM References ──
    const startScreen = document.getElementById("start-screen");
    const gameoverScreen = document.getElementById("gameover-screen");
    const hud = document.getElementById("hud");
    const scoreDisplay = document.getElementById("score-display");
    const finalScoreEl = document.getElementById("final-score");
    const bestScoreEl = document.getElementById("best-score");
    const medalContainer = document.getElementById("medal-container");
    const medalIcon = document.getElementById("medal-icon");
    const medalText = document.getElementById("medal-text");
    const startBtn = document.getElementById("start-btn");
    const retryBtn = document.getElementById("retry-btn");

    // ── Game Constants ──
    const GRAVITY = 0.45;
    const FLAP_FORCE = -7.5;
    const PIPE_WIDTH = 62;
    const PIPE_GAP = 155;
    const PIPE_SPEED = 2.8;
    const PIPE_SPAWN_INTERVAL = 1600; // ms
    const GROUND_HEIGHT = 80;
    const BIRD_RADIUS = 16;
    const BIRD_X = 90;

    // ── Game State ──
    let state = "menu"; // menu | playing | dead
    let bird = {};
    let pipes = [];
    let particles = [];
    let stars = [];
    let score = 0;
    let bestScore = parseInt(localStorage.getItem("flappy_best") || "0");
    let lastPipeSpawn = 0;
    let groundOffset = 0;
    let frameCount = 0;
    let shakeTimer = 0;
    let flashAlpha = 0;

    // ── Star field (background decoration) ──
    function initStars() {
        stars = [];
        for (let i = 0; i < 60; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * (H - GROUND_HEIGHT - 100),
                size: Math.random() * 2 + 0.5,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    // ── Bird Init ──
    function resetBird() {
        bird = {
            x: BIRD_X,
            y: H / 2 - 40,
            vy: 0,
            rotation: 0,
            flapFrame: 0,
            wingUp: true,
            wingTimer: 0
        };
    }

    // ── Pipe Generation ──
    function spawnPipe() {
        const minY = 100;
        const maxY = H - GROUND_HEIGHT - PIPE_GAP - 100;
        const topHeight = Math.random() * (maxY - minY) + minY;
        pipes.push({
            x: W + 10,
            topH: topHeight,
            scored: false
        });
    }

    // ── Particle System ──
    function emitParticles(x, y, count, color, spread) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * spread + 1;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: Math.random() * 0.03 + 0.015,
                size: Math.random() * 4 + 2,
                color
            });
        }
    }

    function emitFlapTrail() {
        for (let i = 0; i < 3; i++) {
            particles.push({
                x: bird.x - 10 + Math.random() * 6,
                y: bird.y + Math.random() * 10 - 5,
                vx: -Math.random() * 1.5 - 0.5,
                vy: Math.random() * 2 - 1,
                life: 1,
                decay: 0.04,
                size: Math.random() * 3 + 1.5,
                color: "rgba(249, 199, 79, ALPHA)"
            });
        }
    }

    // ── Collision Detection ──
    function checkCollision() {
        // Ground
        if (bird.y + BIRD_RADIUS >= H - GROUND_HEIGHT) {
            bird.y = H - GROUND_HEIGHT - BIRD_RADIUS;
            return true;
        }
        // Ceiling
        if (bird.y - BIRD_RADIUS <= 0) {
            bird.y = BIRD_RADIUS;
            return true;
        }
        // Pipes
        for (const pipe of pipes) {
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + PIPE_WIDTH;
            if (bird.x + BIRD_RADIUS > pipeLeft && bird.x - BIRD_RADIUS < pipeRight) {
                if (bird.y - BIRD_RADIUS < pipe.topH || bird.y + BIRD_RADIUS > pipe.topH + PIPE_GAP) {
                    return true;
                }
            }
        }
        return false;
    }

    // ── Flap ──
    function flap() {
        if (state === "menu") {
            startGame();
            return;
        }
        if (state === "dead") return;

        bird.vy = FLAP_FORCE;
        bird.flapFrame = 6;
        bird.wingUp = !bird.wingUp;
        emitFlapTrail();
    }

    // ── Game Flow ──
    function startGame() {
        state = "playing";
        score = 0;
        pipes = [];
        particles = [];
        lastPipeSpawn = 0;
        shakeTimer = 0;
        flashAlpha = 0;
        resetBird();
        bird.vy = FLAP_FORCE;
        emitFlapTrail();

        startScreen.classList.add("hidden");
        gameoverScreen.classList.add("hidden");
        hud.classList.remove("hidden");
        scoreDisplay.textContent = "0";
    }

    function die() {
        state = "dead";
        shakeTimer = 14;
        flashAlpha = 0.6;

        // Explosion particles
        emitParticles(bird.x, bird.y, 20, "rgba(231, 111, 81, ALPHA)", 4);
        emitParticles(bird.x, bird.y, 10, "rgba(249, 199, 79, ALPHA)", 3);

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem("flappy_best", bestScore.toString());
        }

        // Delay showing game over screen
        setTimeout(showGameOver, 800);
    }

    function showGameOver() {
        hud.classList.add("hidden");
        finalScoreEl.textContent = score;
        bestScoreEl.textContent = bestScore;

        // Medal logic
        if (score >= 40) {
            medalContainer.classList.remove("hidden");
            medalIcon.textContent = "👑";
            medalText.textContent = "Platinum";
        } else if (score >= 20) {
            medalContainer.classList.remove("hidden");
            medalIcon.textContent = "🥇";
            medalText.textContent = "Gold";
        } else if (score >= 10) {
            medalContainer.classList.remove("hidden");
            medalIcon.textContent = "🥈";
            medalText.textContent = "Silver";
        } else if (score >= 5) {
            medalContainer.classList.remove("hidden");
            medalIcon.textContent = "🥉";
            medalText.textContent = "Bronze";
        } else {
            medalContainer.classList.add("hidden");
        }

        gameoverScreen.classList.remove("hidden");
    }

    // ═══════════════════════════════════════════
    //  RENDERING
    // ═══════════════════════════════════════════

    // ── Sky Gradient ──
    function drawSky() {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#0f0c29");
        grad.addColorStop(0.4, "#302b63");
        grad.addColorStop(0.7, "#24243e");
        grad.addColorStop(1, "#1a1a2e");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // ── Stars ──
    function drawStars() {
        for (const star of stars) {
            const alpha = 0.4 + 0.6 * Math.sin(frameCount * star.twinkleSpeed + star.phase);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── Moon ──
    function drawMoon() {
        const mx = W - 80;
        const my = 90;
        // Glow
        const glow = ctx.createRadialGradient(mx, my, 15, mx, my, 80);
        glow.addColorStop(0, "rgba(249, 199, 79, 0.15)");
        glow.addColorStop(1, "rgba(249, 199, 79, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(mx - 80, my - 80, 160, 160);
        // Moon body
        ctx.fillStyle = "#f9c74f";
        ctx.beginPath();
        ctx.arc(mx, my, 28, 0, Math.PI * 2);
        ctx.fill();
        // Crescent shadow
        ctx.fillStyle = "#e0a82e";
        ctx.beginPath();
        ctx.arc(mx + 8, my - 3, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f9c74f";
        ctx.beginPath();
        ctx.arc(mx + 2, my - 5, 22, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Distant City Silhouette ──
    function drawCitySilhouette() {
        const baseY = H - GROUND_HEIGHT;
        ctx.fillStyle = "rgba(15, 15, 35, 0.7)";
        
        const buildings = [
            { x: 10, w: 30, h: 70 },
            { x: 45, w: 20, h: 100 },
            { x: 70, w: 35, h: 55 },
            { x: 115, w: 25, h: 90 },
            { x: 145, w: 40, h: 65 },
            { x: 195, w: 18, h: 110 },
            { x: 218, w: 32, h: 50 },
            { x: 255, w: 28, h: 80 },
            { x: 290, w: 22, h: 95 },
            { x: 320, w: 35, h: 60 },
            { x: 360, w: 20, h: 85 },
            { x: 385, w: 30, h: 45 },
        ];

        for (const b of buildings) {
            ctx.fillRect(b.x, baseY - b.h, b.w, b.h);
            // Windows
            ctx.fillStyle = "rgba(249, 199, 79, 0.15)";
            for (let wy = baseY - b.h + 8; wy < baseY - 8; wy += 14) {
                for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 10) {
                    if (Math.random() > 0.4) {
                        ctx.fillRect(wx, wy, 4, 6);
                    }
                }
            }
            ctx.fillStyle = "rgba(15, 15, 35, 0.7)";
        }
    }

    // ── Pipes ──
    function drawPipe(pipe) {
        const x = pipe.x;
        const topH = pipe.topH;
        const bottomY = topH + PIPE_GAP;
        const bottomH = H - GROUND_HEIGHT - bottomY;

        // Pipe body - top
        const grad1 = ctx.createLinearGradient(x, 0, x + PIPE_WIDTH, 0);
        grad1.addColorStop(0, "#2a9d8f");
        grad1.addColorStop(0.3, "#40c9a2");
        grad1.addColorStop(0.7, "#2a9d8f");
        grad1.addColorStop(1, "#1f7a6d");

        ctx.fillStyle = grad1;
        ctx.fillRect(x, 0, PIPE_WIDTH, topH);
        ctx.fillRect(x, bottomY, PIPE_WIDTH, bottomH);

        // Pipe caps
        const capW = PIPE_WIDTH + 10;
        const capH = 28;
        const capX = x - 5;

        const grad2 = ctx.createLinearGradient(capX, 0, capX + capW, 0);
        grad2.addColorStop(0, "#40c9a2");
        grad2.addColorStop(0.3, "#56e0b8");
        grad2.addColorStop(0.7, "#40c9a2");
        grad2.addColorStop(1, "#2a9d8f");

        ctx.fillStyle = grad2;
        // Top pipe cap
        drawRoundRect(capX, topH - capH, capW, capH, 6);
        // Bottom pipe cap
        drawRoundRect(capX, bottomY, capW, capH, 6);

        // Pipe shine highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fillRect(x + 6, 0, 6, topH - capH);
        ctx.fillRect(x + 6, bottomY + capH, 6, bottomH - capH);

        // Pipe edge shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(x + PIPE_WIDTH - 4, 0, 4, topH);
        ctx.fillRect(x + PIPE_WIDTH - 4, bottomY, 4, bottomH);
    }

    function drawRoundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    // ── Bird ──
    function drawBird() {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.rotation);

        // Glow aura
        const auraGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 28);
        auraGrad.addColorStop(0, "rgba(249, 199, 79, 0.25)");
        auraGrad.addColorStop(1, "rgba(249, 199, 79, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = "#f9c74f";
        ctx.beginPath();
        ctx.ellipse(0, 0, BIRD_RADIUS, BIRD_RADIUS - 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = "#fde68a";
        ctx.beginPath();
        ctx.ellipse(2, 4, 10, 8, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Eye white
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(7, -5, 6, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = "#1a1a2e";
        ctx.beginPath();
        ctx.arc(9, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlight
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(10, -6.5, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = "#e76f51";
        ctx.beginPath();
        ctx.moveTo(14, -2);
        ctx.lineTo(22, 1);
        ctx.lineTo(14, 4);
        ctx.closePath();
        ctx.fill();

        // Wing
        const wingY = bird.wingUp || bird.flapFrame > 0 ? -6 : 4;
        ctx.fillStyle = "#f4a261";
        ctx.beginPath();
        ctx.ellipse(-6, wingY, 10, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // ── Ground ──
    function drawGround() {
        const y = H - GROUND_HEIGHT;
        
        // Ground body
        const grad = ctx.createLinearGradient(0, y, 0, H);
        grad.addColorStop(0, "#264653");
        grad.addColorStop(0.15, "#1d3a43");
        grad.addColorStop(1, "#14292f");
        ctx.fillStyle = grad;
        ctx.fillRect(0, y, W, GROUND_HEIGHT);

        // Grass top
        const grassGrad = ctx.createLinearGradient(0, y, 0, y + 12);
        grassGrad.addColorStop(0, "#2a9d8f");
        grassGrad.addColorStop(1, "#264653");
        ctx.fillStyle = grassGrad;
        ctx.fillRect(0, y, W, 12);

        // Grass tufts (scrolling)
        ctx.fillStyle = "#40c9a2";
        for (let gx = -20 + (groundOffset % 24); gx < W + 20; gx += 24) {
            ctx.beginPath();
            ctx.moveTo(gx, y);
            ctx.lineTo(gx + 4, y - 6);
            ctx.lineTo(gx + 8, y);
            ctx.fill();
        }

        // Ground texture dots
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        for (let dx = (groundOffset % 16); dx < W; dx += 16) {
            for (let dy = y + 18; dy < H - 10; dy += 18) {
                ctx.fillRect(dx, dy, 3, 3);
            }
        }
    }

    // ── Particles ──
    function drawParticles() {
        for (const p of particles) {
            const color = p.color.replace("ALPHA", p.life.toFixed(2));
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ── Flash Effect ──
    function drawFlash() {
        if (flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    // ── Score Popup ("+1" floating text) ──
    let scorePopups = [];
    function addScorePopup(x, y) {
        scorePopups.push({ x, y, life: 1, text: "+1" });
    }

    function drawScorePopups() {
        for (const sp of scorePopups) {
            ctx.globalAlpha = sp.life;
            ctx.fillStyle = "#f9c74f";
            ctx.font = `bold ${20 + (1 - sp.life) * 10}px 'Fredoka One', cursive`;
            ctx.textAlign = "center";
            ctx.fillText(sp.text, sp.x, sp.y);
            ctx.globalAlpha = 1;
        }
    }

    // ═══════════════════════════════════════════
    //  UPDATE LOOP
    // ═══════════════════════════════════════════

    function update() {
        frameCount++;

        if (state === "playing") {
            // Bird physics
            bird.vy += GRAVITY;
            bird.y += bird.vy;

            // Rotation based on velocity
            const targetRotation = Math.max(-0.5, Math.min(bird.vy * 0.06, 1.2));
            bird.rotation += (targetRotation - bird.rotation) * 0.15;

            // Wing animation
            if (bird.flapFrame > 0) bird.flapFrame--;
            bird.wingTimer++;
            if (bird.wingTimer > 8) {
                bird.wingUp = !bird.wingUp;
                bird.wingTimer = 0;
            }

            // Pipes
            const now = performance.now();
            if (now - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
                spawnPipe();
                lastPipeSpawn = now;
            }

            for (let i = pipes.length - 1; i >= 0; i--) {
                pipes[i].x -= PIPE_SPEED;

                // Score
                if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x) {
                    pipes[i].scored = true;
                    score++;
                    scoreDisplay.textContent = score;
                    addScorePopup(bird.x, bird.y - 30);
                    // Score particles
                    emitParticles(bird.x, bird.y - 25, 5, "rgba(249, 199, 79, ALPHA)", 2);
                }

                // Remove off-screen pipes
                if (pipes[i].x < -PIPE_WIDTH - 20) {
                    pipes.splice(i, 1);
                }
            }

            // Ground scroll
            groundOffset -= PIPE_SPEED;

            // Collision
            if (checkCollision()) {
                die();
            }
        } else if (state === "dead") {
            // Bird falls after death
            if (bird.y + BIRD_RADIUS < H - GROUND_HEIGHT) {
                bird.vy += GRAVITY;
                bird.y += bird.vy;
                bird.rotation += 0.12;
                if (bird.y + BIRD_RADIUS >= H - GROUND_HEIGHT) {
                    bird.y = H - GROUND_HEIGHT - BIRD_RADIUS;
                }
            }
        } else if (state === "menu") {
            // Idle bird bobbing
            bird.y = H / 2 - 40 + Math.sin(frameCount * 0.04) * 15;
            bird.rotation = Math.sin(frameCount * 0.04) * 0.1;
            bird.wingTimer++;
            if (bird.wingTimer > 10) {
                bird.wingUp = !bird.wingUp;
                bird.wingTimer = 0;
            }
        }

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) particles.splice(i, 1);
        }

        // Update score popups
        for (let i = scorePopups.length - 1; i >= 0; i--) {
            scorePopups[i].y -= 1.5;
            scorePopups[i].life -= 0.025;
            if (scorePopups[i].life <= 0) scorePopups.splice(i, 1);
        }

        // Shake decay
        if (shakeTimer > 0) shakeTimer--;

        // Flash decay
        if (flashAlpha > 0) flashAlpha -= 0.04;
    }

    // ═══════════════════════════════════════════
    //  RENDER LOOP
    // ═══════════════════════════════════════════

    function render() {
        ctx.save();

        // Screen shake
        if (shakeTimer > 0) {
            const intensity = shakeTimer * 0.8;
            ctx.translate(
                (Math.random() - 0.5) * intensity * 2,
                (Math.random() - 0.5) * intensity * 2
            );
        }

        drawSky();
        drawStars();
        drawMoon();
        drawCitySilhouette();

        // Draw pipes
        for (const pipe of pipes) {
            drawPipe(pipe);
        }

        drawParticles();
        drawBird();
        drawGround();
        drawScorePopups();
        drawFlash();

        ctx.restore();
    }

    // ── Main Loop ──
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    // ═══════════════════════════════════════════
    //  INPUT HANDLING
    // ═══════════════════════════════════════════

    // Keyboard
    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.code === "ArrowUp") {
            e.preventDefault();
            flap();
        }
    });

    // Mouse / Touch on canvas
    canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();
        flap();
    });

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        flap();
    }, { passive: false });

    // Buttons
    startBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startGame();
    });

    retryBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        startGame();
    });

    // ═══════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════

    initStars();
    resetBird();
    gameLoop();
})();
