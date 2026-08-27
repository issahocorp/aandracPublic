(function () {
	const hero = document.querySelector("[data-parallax-hero]");
	if (!hero) {
		return;
	}

	const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}

	function addMediaListener(mq, handler) {
		if (typeof mq.addEventListener === "function") {
			mq.addEventListener("change", handler);
		} else if (typeof mq.addListener === "function") {
			mq.addListener(handler);
		}
	}

	function initTitleShadow() {
		const title = hero.querySelector("[data-pointer-shadow]");
		if (!title) {
			return;
		}

		const shadowShift = 6;
		const secondaryShift = 4;
		const shadowEase = 0.13;
		const secondaryEase = 0.08;
		let shadowTargetX = 0;
		let shadowTargetY = 0;
		let shadowCurrentX = 0;
		let shadowCurrentY = 0;
		let secondaryTargetX = 0;
		let secondaryTargetY = 0;
		let secondaryCurrentX = 0;
		let secondaryCurrentY = 0;
		let frameId = null;
		let enabled = false;

		function render() {
			frameId = null;
			shadowCurrentX += (shadowTargetX - shadowCurrentX) * shadowEase;
			shadowCurrentY += (shadowTargetY - shadowCurrentY) * shadowEase;
			secondaryCurrentX += (secondaryTargetX - secondaryCurrentX) * secondaryEase;
			secondaryCurrentY += (secondaryTargetY - secondaryCurrentY) * secondaryEase;
			title.style.setProperty("--title-shadow-x", shadowCurrentX.toFixed(2) + "px");
			title.style.setProperty("--title-shadow-y", shadowCurrentY.toFixed(2) + "px");
			title.style.setProperty("--title-shadow-secondary-x", secondaryCurrentX.toFixed(2) + "px");
			title.style.setProperty("--title-shadow-secondary-y", secondaryCurrentY.toFixed(2) + "px");

			if (
				enabled &&
				(
					Math.abs(shadowTargetX - shadowCurrentX) > 0.02 ||
					Math.abs(shadowTargetY - shadowCurrentY) > 0.02 ||
					Math.abs(secondaryTargetX - secondaryCurrentX) > 0.02 ||
					Math.abs(secondaryTargetY - secondaryCurrentY) > 0.02
				)
			) {
				frameId = window.requestAnimationFrame(render);
			}
		}

		function requestRender() {
			if (enabled && null === frameId) {
				frameId = window.requestAnimationFrame(render);
			}
		}

		function reset() {
			shadowTargetX = shadowTargetY = secondaryTargetX = secondaryTargetY = 0;
			requestRender();
		}

		function onPointerMove(event) {
			if (!enabled) {
				return;
			}

			const bounds = title.getBoundingClientRect();
			const centerX = bounds.left + bounds.width / 2;
			const centerY = bounds.top + bounds.height / 2;
			const x = clamp((event.clientX - centerX) / Math.max(1, window.innerWidth / 2), -1, 1);
			const y = clamp((event.clientY - centerY) / Math.max(1, window.innerHeight / 2), -1, 1);

			shadowTargetX = -x * shadowShift;
			shadowTargetY = -y * shadowShift;
			secondaryTargetX = x * secondaryShift;
			secondaryTargetY = y * secondaryShift * 0.65;
			requestRender();
		}

		function clear() {
			if (null !== frameId) {
				window.cancelAnimationFrame(frameId);
			}
			frameId = null;
			shadowTargetX = shadowTargetY = shadowCurrentX = shadowCurrentY = 0;
			secondaryTargetX = secondaryTargetY = secondaryCurrentX = secondaryCurrentY = 0;
			title.style.removeProperty("--title-shadow-x");
			title.style.removeProperty("--title-shadow-y");
			title.style.removeProperty("--title-shadow-secondary-x");
			title.style.removeProperty("--title-shadow-secondary-y");
		}

		function updateMode() {
			enabled = !reducedMotion.matches;
			hero.classList.toggle("is-title-shadow-enabled", enabled);

			if (!enabled) {
				clear();
			}
		}

		window.addEventListener("pointermove", onPointerMove, { passive: true });
		document.addEventListener("mouseleave", reset);
		window.addEventListener("blur", reset);
		addMediaListener(finePointer, updateMode);
		addMediaListener(reducedMotion, updateMode);
		updateMode();
	}

	function initScrollParallax() {
		const layerEls = Array.from(hero.querySelectorAll("[data-scroll-layer]"));

		const layers = layerEls.map(function (el) {
			return {
				el: el,
				speed: parseFloat(el.getAttribute("data-speed")) || 0,
			};
		});

		let frameId = null;
		let enabled = false;

		function write() {
			const y = window.scrollY;

			layers.forEach(function (layer) {
				layer.el.style.setProperty("--scroll-y", Math.round(-y * layer.speed) + "px");
			});
		}

		function update() {
			frameId = null;
			if (enabled) {
				write();
			}
		}

		function requestUpdate() {
			if (enabled && null === frameId) {
				frameId = window.requestAnimationFrame(update);
			}
		}

		function clear() {
			if (null !== frameId) {
				window.cancelAnimationFrame(frameId);
			}
			frameId = null;
			layers.forEach(function (layer) {
				layer.el.style.removeProperty("--scroll-y");
			});
		}

		function updateMode() {
			enabled = !reducedMotion.matches;
			hero.classList.toggle("is-scroll-parallax-enabled", enabled);

			if (!enabled) {
				clear();
				return;
			}

			requestUpdate();
		}

		window.addEventListener("scroll", requestUpdate, { passive: true });
		window.addEventListener("resize", requestUpdate, { passive: true });
		addMediaListener(reducedMotion, updateMode);
		updateMode();
	}

	function initComets() {
		const cometEls = Array.from(hero.querySelectorAll("[data-scroll-comet]"));
		if (!cometEls.length) {
			return;
		}

		const comets = cometEls.map(function (el) {
			const direction = el.getAttribute("data-direction") === "up" ? "up" : "down";

			return {
				el: el,
				start: parseFloat(el.getAttribute("data-start")) || 0,
				duration: Math.max(0.08, parseFloat(el.getAttribute("data-duration")) || 0.2),
				x: parseFloat(el.getAttribute("data-x")) || 0,
				y: parseFloat(el.getAttribute("data-y")) || 0,
				direction: direction,
			};
		});

		let frameId = null;
		let enabled = false;
		let lastY = window.scrollY;
		let scrollDir = 0;

		function hideComet(comet) {
			comet.el.style.setProperty("--comet-opacity", "0");
			comet.el.style.setProperty("--comet-x", "0px");
			comet.el.style.setProperty("--comet-y", "0px");
		}

		function write() {
			const y = window.scrollY;

			if (y > lastY + 0.5) {
				scrollDir = 1;
			} else if (y < lastY - 0.5) {
				scrollDir = -1;
			}

			lastY = y;

			const progress = y / Math.max(1, window.innerHeight);

			comets.forEach(function (comet) {
				const raw = (progress - comet.start) / comet.duration;
				const inZone = raw > 0 && raw < 1;
				const goingDown = scrollDir === 1;
				const goingUp = scrollDir === -1;
				const shouldShow =
					inZone &&
					((comet.direction === "down" && goingDown) || (comet.direction === "up" && goingUp));

				if (!shouldShow) {
					hideComet(comet);
					return;
				}

				const t = clamp(raw, 0, 1);
				const centered = t - 0.5;
				const opacity = Math.sin(Math.PI * t) * 0.72;

				comet.el.style.setProperty("--comet-x", centered * window.innerWidth * (comet.x / 100) + "px");
				comet.el.style.setProperty("--comet-y", centered * window.innerHeight * (comet.y / 100) + "px");
				comet.el.style.setProperty("--comet-opacity", opacity.toFixed(3));
			});
		}

		function update() {
			frameId = null;
			if (enabled) {
				write();
			}
		}

		function requestUpdate() {
			if (enabled && null === frameId) {
				frameId = window.requestAnimationFrame(update);
			}
		}

		function clear() {
			if (null !== frameId) {
				window.cancelAnimationFrame(frameId);
			}
			frameId = null;
			scrollDir = 0;
			lastY = window.scrollY;
			comets.forEach(hideComet);
		}

		function updateMode() {
			enabled = !reducedMotion.matches;
			hero.classList.toggle("is-comet-enabled", enabled);

			if (!enabled) {
				clear();
				return;
			}

			requestUpdate();
		}

		window.addEventListener("scroll", requestUpdate, { passive: true });
		window.addEventListener("resize", requestUpdate, { passive: true });
		addMediaListener(reducedMotion, updateMode);
		updateMode();
	}

	function initRocket() {
		const rocket = hero.querySelector("[data-scroll-rocket]");
		if (!rocket) {
			return;
		}

		let frameId = null;
		let enabled = false;
		let phase = "outbound";
		let outboundMax = 0;
		let returnMax = 0;
		let armed = false;
		let lastY = window.scrollY;

		function ease(t) {
			return t * t * (3 - 2 * t);
		}

		function writeRocket(x, y, scale, opacity, rotate) {
			rocket.style.setProperty("--rocket-x", Math.round(x) + "px");
			rocket.style.setProperty("--rocket-y", Math.round(y) + "px");
			rocket.style.setProperty("--rocket-scale", String(scale));
			rocket.style.setProperty("--rocket-opacity", String(opacity));
			rocket.style.setProperty("--rocket-rotate", (rotate || 0) + "deg");
		}

		function updateRocket() {
			frameId = null;

			if (!enabled || phase === "done") {
				return;
			}

			const y = window.scrollY;
			const scrollingUp = y < lastY - 0.5;

			if (phase === "outbound") {
				const range = Math.max(1, window.innerHeight * 1.35);
				const t = clamp(y / range, 0, 1);

				if (t > outboundMax) {
					outboundMax = t;
				}

				const s = ease(outboundMax);
				writeRocket(s * window.innerWidth * 0.55, s * window.innerHeight * -1.2, 1, 1, 0);

				if (outboundMax >= 1) {
					phase = "waiting";
					writeRocket(window.innerWidth, -window.innerHeight, 1, 0, 0);
				}
			} else if (phase === "waiting") {
				if (y > window.innerHeight * 0.75) {
					armed = true;
				}

				if (armed && scrollingUp && y < window.innerHeight * 1.05) {
					phase = "returning";
				}
			}

			if (phase === "returning") {
				const returnRange = Math.max(1, window.innerHeight * 0.7);
				const t = clamp(1 - y / returnRange, 0, 1);

				if (t > returnMax) {
					returnMax = t;
				}

				const s = ease(returnMax);
				const startX = -window.innerWidth * 0.92;
				const endX = -window.innerWidth * 0.58;
				const startY = -window.innerHeight * 0.42;
				const endY = -window.innerHeight * 0.98;

				writeRocket(
					startX + (endX - startX) * s,
					startY + (endY - startY) * s,
					0.5,
					1,
					-38
				);

				if (returnMax >= 1) {
					phase = "done";
					writeRocket(endX, endY, 0.5, 0, -38);
				}
			}

			lastY = y;
		}

		function requestRocket() {
			if (enabled && phase !== "done" && null === frameId) {
				frameId = window.requestAnimationFrame(updateRocket);
			}
		}

		function clearRocket() {
			if (null !== frameId) {
				window.cancelAnimationFrame(frameId);
			}
			frameId = null;
			phase = "outbound";
			outboundMax = 0;
			returnMax = 0;
			armed = false;
			lastY = window.scrollY;
			rocket.style.removeProperty("--rocket-x");
			rocket.style.removeProperty("--rocket-y");
			rocket.style.removeProperty("--rocket-scale");
			rocket.style.removeProperty("--rocket-opacity");
			rocket.style.removeProperty("--rocket-rotate");
		}

		function updateMode() {
			enabled = !reducedMotion.matches;
			hero.classList.toggle("is-rocket-enabled", enabled);

			if (!enabled) {
				clearRocket();
				return;
			}

			requestRocket();
		}

		window.addEventListener("scroll", requestRocket, { passive: true });
		window.addEventListener("resize", requestRocket, { passive: true });
		addMediaListener(reducedMotion, updateMode);
		updateMode();
	}

	initTitleShadow();
	initScrollParallax();
	initComets();
	initRocket();
})();
