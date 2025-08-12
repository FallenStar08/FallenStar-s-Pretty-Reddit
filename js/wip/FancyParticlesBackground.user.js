// ==UserScript==
// @name         Old Reddit Animated Background + Background Ripple on Vote
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Adds animated transparent background and big background ripple effect on up/downvote clicks on old Reddit
// @match        https://old.reddit.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/FallenStar08/FallenStar-s-Pretty-Reddit/refs/heads/main/js/wip/FancyParticlesBackground.user.js
// @updateURL    https://raw.githubusercontent.com/FallenStar08/FallenStar-s-Pretty-Reddit/refs/heads/main/js/wip/FancyParticlesBackground.user.js
// @author       FallenStar
// ==/UserScript==

(function () {
	"use strict";

	//SECTION STYLE
	const style = document.createElement("style");
	style.textContent = `
    body {
        background: transparent !important;
        position: relative;
        overflow-x: hidden;
        z-index: 0;
    }

    #animated-bg {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: -2;
        background: linear-gradient(135deg, rgba(10,10,25,0.40), rgba(15,15,35,0.45));
        overflow: hidden;
        backdrop-filter: blur(8px);
    }

    .particle {
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        box-shadow: 0 0 8px 2px rgba(255,255,255,0.1);
        animation-timing-function: ease-in-out;
        will-change: transform, opacity;
        filter: drop-shadow(0 0 3px rgba(255,255,255,0.15));
        mix-blend-mode: screen;
    }

    /* Background ripple container */
    #background-ripples {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: -1;
        overflow: visible;
    }

    /* Ripple circle */
    .bg-ripple {
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        opacity: 0.5;
        animation: bg-ripple-expand 800ms ease-out forwards;
        pointer-events: none;
        filter: drop-shadow(0 0 15px currentColor);
    }

    @keyframes bg-ripple-expand {
        to {
            transform: scale(12);
            opacity: 0;
        }
    }
    `;
	document.head.appendChild(style);
	//!SECTION

	//SECTION GLOBALS

	// Particle parameters
	const PARTICLE_COUNT = 80;
	const particles = [];
	// Track ripples affecting particles
	const activeRipples = [];
	const RIPPLE_STRENGTH = 30;
	// Speed at which particles get back in place post ripple
	const BACK_HOME_SPEED = 0.001;

	//!SECTION

	//SECTION UTILS
	function randRange(min, max) {
		return Math.random() * (max - min) + min;
	}

	function createBackgroundContainer() {
		const bg = document.createElement("div");
		bg.id = "animated-bg";
		document.body.prepend(bg);
		return bg;
	}

	function createBackgroundRippleContainer() {
		const rippleContainer = document.createElement("div");
		rippleContainer.id = "background-ripples";
		document.body.prepend(rippleContainer);
		return rippleContainer;
	}

	//!SECTION

	//SECTION PARTICLES
	function createParticles(bg) {
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const p = document.createElement("div");
			p.classList.add("particle");

			const size = randRange(6, 14);
			p.style.width = size + "px";
			p.style.height = size + "px";

			p.style.left = randRange(0, window.innerWidth) + "px";
			p.style.top = randRange(0, window.innerHeight) + "px";

			p.style.opacity = randRange(0.05, 0.25);

			bg.appendChild(p);

			particles.push({
				el: p,
				size: size,
				baseX: parseFloat(p.style.left),
				baseY: parseFloat(p.style.top),
				moveRangeX: randRange(20, 80),
				moveRangeY: randRange(10, 50),
				speed: randRange(8000, 16000),
				offset: Math.random() * 2 * Math.PI,
			});
		}

		particles.forEach((p) => (p.offsetX = 0));
		particles.forEach((p) => (p.offsetY = 0));
	}
	//!SECTION

	//SECTION ANIMATION

	function animate(time = 0) {
		particles.forEach((p) => {
			const t = time / p.speed + p.offset;

			// Base drifting pos
			const baseX = p.baseX + Math.sin(t) * p.moveRangeX;
			const baseY = p.baseY + Math.cos(t * 1.1) * p.moveRangeY;

			// Accumulated push for this frame from active ripples
			let pushX = 0,
				pushY = 0;

			activeRipples.forEach((ripple) => {
				const elapsed = time - ripple.startTime;
				if (elapsed > ripple.duration) return;

				const progress = elapsed / ripple.duration;
				const radius = ripple.maxRadius * progress;

				const dx = baseX + p.offsetX - ripple.centerX;
				const dy = baseY + p.offsetY - ripple.centerY;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < radius && dist > 0) {
					const force = (1 - dist / radius) * RIPPLE_STRENGTH;
					pushX += (dx / dist) * force;
					pushY += (dy / dist) * force;
				}
			});

			// Add push to persistent offset (accumulate displacement)
			p.offsetX += pushX * 0.5;
			p.offsetY += pushY * 0.5;

			// Speed at which particles get back in place post ripple
			p.offsetX *= 1 - BACK_HOME_SPEED;
			p.offsetY *= 1 - BACK_HOME_SPEED;

			// Final position = base drifting + persistent offset
			const finalX = baseX + p.offsetX;
			const finalY = baseY + p.offsetY;

			p.el.style.transform = `translate(${finalX - p.baseX}px, ${
				finalY - p.baseY
			}px)`;

			const opacity = 0.15 + Math.sin(t * 1.3) * 0.1;
			p.el.style.opacity = opacity;
		});

		requestAnimationFrame(animate);
	}

	window.addEventListener("resize", () => {
		particles.forEach((p) => {
			p.baseX = randRange(0, window.innerWidth);
			p.baseY = randRange(0, window.innerHeight);
			p.el.style.left = p.baseX + "px";
			p.el.style.top = p.baseY + "px";
		});
	});
	//!SECTION

	//SECTION RIPPLES

	// add ripple data to activeRipples
	function createBackgroundRipple(rippleContainer, color) {
		const ripple = document.createElement("div");
		ripple.classList.add("bg-ripple");
		ripple.style.backgroundColor = color;

		const cx = window.innerWidth / 2;
		const cy = window.innerHeight / 2;
		const size = 100;
		ripple.style.width = ripple.style.height = size + "px";
		ripple.style.left = cx - size / 2 + "px";
		ripple.style.top = cy - size / 2 + "px";

		rippleContainer.appendChild(ripple);

		// ripple info for particles
		const rippleData = {
			element: ripple,
			centerX: cx,
			centerY: cy,
			startTime: performance.now(),
			duration: 800,
			maxRadius: (size / 2) * 12, // scale(12) in CSS animation
		};
		activeRipples.push(rippleData);

		ripple.addEventListener("animationend", () => {
			ripple.remove();
			const idx = activeRipples.indexOf(rippleData);
			if (idx !== -1) activeRipples.splice(idx, 1);
		});
	}

	function onVoteClick(event, rippleContainer) {
		const button = event.currentTarget;
		let color = null;

		if (button.classList.contains("up")) {
			color = "rgba(72, 255, 0, 0.35)";
		} else if (button.classList.contains("down")) {
			color = "rgba(255, 140, 0, 0.35)";
		}

		if (color) {
			createBackgroundRipple(rippleContainer, color);
		}
	}

	const handleVoteClick = (e) => onVoteClick(e, rippleContainer);

	function attachRippleListeners(rippleContainer) {
		const upvoteButtons = document.querySelectorAll(".arrow.up");
		const downvoteButtons = document.querySelectorAll(".arrow.down");

		upvoteButtons.forEach((btn) => {
			btn.removeEventListener("click", handleVoteClick);
			btn.addEventListener("click", handleVoteClick);
		});

		downvoteButtons.forEach((btn) => {
			btn.removeEventListener("click", handleVoteClick);
			btn.addEventListener("click", handleVoteClick);
		});
	}
	//!SECTION

	//SECTION INIT
	const bg = createBackgroundContainer();
	const rippleContainer = createBackgroundRippleContainer();
	createParticles(bg);
	attachRippleListeners(rippleContainer);
	requestAnimationFrame(animate);

	// Watch for dynamically added vote buttons (comments loading)
	const observer = new MutationObserver(() => {
		attachRippleListeners(rippleContainer);
	});

	observer.observe(document.body, { childList: true, subtree: true });
})();
