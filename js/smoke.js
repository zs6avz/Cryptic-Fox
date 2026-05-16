/**
 * Smoke Effect for Cryptic Fox
 * High-performance canvas-based particle system for ambient backgrounds.
 */

class SmokeEffect {
    constructor(container = document.body) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 40;
        this.active = true;

        this.init();
    }

    init() {
        this.canvas.id = 'ambientSmokeCanvas';
        this.applyStyles();
        this.container.appendChild(this.canvas);

        window.addEventListener('resize', () => this.resize());
        this.resize();

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.canvas));
        }

        this.animate();
    }

    applyStyles() {
        Object.assign(this.canvas.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            maxWidth: 'none',
            margin: '0',
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            borderRadius: '0',
            zIndex: '-1',
            pointerEvents: 'none',
            opacity: '0.6'
        });
    }

    resize() {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (oldWidth > 0 && oldHeight > 0 && this.particles && this.particles.length > 0) {
            const scaleX = this.canvas.width / oldWidth;
            const scaleY = this.canvas.height / oldHeight;
            for (const particle of this.particles) {
                particle.x *= scaleX;
                particle.y *= scaleY;
            }
        }
    }

    animate() {
        if (!this.active) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const particle of this.particles) {
            particle.update();
            particle.draw(this.ctx);
        }

        requestAnimationFrame(() => this.animate());
    }

    stop() {
        this.active = false;
    }

    start() {
        if (!this.active) {
            this.active = true;
            this.animate();
        }
    }
}

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset(true);
    }

    reset(initial = false) {
        this.x = Math.random() * this.canvas.width;
        this.y = initial ? Math.random() * this.canvas.height : this.canvas.height + 100;
        this.size = Math.random() * 200 + 100;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * -1 - 0.2; // Drift upwards
        this.life = initial ? Math.random() * 400 : 0;
        this.maxLife = Math.random() * 400 + 200;
        this.opacityMultiplier = Math.random() * 0.1 + 0.05;
        
        // Slightly vary colors for a more premium look (cool blue/grey tones)
        const blueTint = Math.floor(Math.random() * 30 + 220);
        this.color = `200, ${blueTint}, 255`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;

        if (this.x > this.canvas.width + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = this.canvas.width + this.size;

        if (this.life >= this.maxLife || this.y < -this.size) {
            this.reset();
        }
    }

    draw(ctx) {
        const limit = this.maxLife / 2;
        let envelope = 1 - (Math.abs(this.life - limit) / limit);
        if (envelope < 0) envelope = 0;
        const opacity = envelope * this.opacityMultiplier;

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, `rgba(${this.color}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${this.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Auto-initialize if the body has a specific class or if explicitly requested
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('smoke-bg') || document.body.classList.contains('tep-page')) {
        window.smokeEffect = new SmokeEffect();
    }
});
