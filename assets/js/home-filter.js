(function () {
	const root = document.querySelector("[data-projetos-filter]");
	if (!root) {
		return;
	}

	const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
	const items = Array.from(root.querySelectorAll("[data-categories]"));
	const empty = root.querySelector("[data-filter-empty]");

	if (!tabs.length) {
		return;
	}

	const grid = root.querySelector(".home-projetos__grid");
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const moveMs = 480;
	let settleTimer = 0;
	let animating = false;
	let activeFilter = "all";

	function markLastRow() {
		if (!grid) {
			return;
		}

		const visible = items.filter(function (item) {
			return !item.hidden && item.style.position !== "absolute";
		});

		items.forEach(function (item) {
			item.classList.remove("is-last-row");
		});

		if (!visible.length) {
			return;
		}

		let maxTop = -1;
		const tops = visible.map(function (item) {
			const top = item.offsetTop;
			if (top > maxTop) {
				maxTop = top;
			}
			return top;
		});

		visible.forEach(function (item, index) {
			if (tops[index] === maxTop) {
				item.classList.add("is-last-row");
			}
		});
	}

	function matchesFilter(item, filter) {
		const cats = (item.getAttribute("data-categories") || "").split(/\s+/).filter(Boolean);
		return "all" === filter || cats.indexOf(filter) !== -1;
	}

	function pauseHiddenVideos() {
		items.forEach(function (item) {
			if (item.hidden) {
				const video = item.querySelector("video");
				if (video) {
					video.pause();
					video.currentTime = 0;
				}
			}
		});
	}

	function resetItemStyles(item) {
		item.classList.remove("is-filter-leave", "is-filter-enter");
		item.style.transition = "";
		item.style.transitionDelay = "";
		item.style.transform = "";
		item.style.opacity = "";
		item.style.position = "";
		item.style.left = "";
		item.style.top = "";
		item.style.width = "";
		item.style.zIndex = "";
		item.style.margin = "";
	}

	function clearFilterStyles() {
		window.clearTimeout(settleTimer);
		animating = false;
		root.classList.remove("is-filtering", "is-filter-out");
		if (grid) {
			grid.style.minHeight = "";
		}
		items.forEach(resetItemStyles);
	}

	function syncVisibility(filter) {
		let visible = 0;

		items.forEach(function (item) {
			const show = matchesFilter(item, filter);
			item.hidden = !show;
			item.setAttribute("aria-hidden", show ? "false" : "true");
			if (show) {
				visible += 1;
			}
		});

		if (empty) {
			empty.hidden = visible > 0;
		}

		pauseHiddenVideos();
		markLastRow();
	}

	function collapseFilterMenu() {
		const filterBtn = root.querySelector(".filter-toggle");
		if (!filterBtn || "true" !== filterBtn.getAttribute("aria-expanded")) {
			return;
		}

		const tabsEl = root.querySelector(".home-projetos__tabs");
		if (tabsEl) {
			tabsEl.style.transition = "none";
		}

		filterBtn.setAttribute("aria-expanded", "false");
		const openLabel = filterBtn.getAttribute("data-open-label");
		if (openLabel) {
			filterBtn.setAttribute("aria-label", openLabel);
		}

		if (tabsEl) {
			void tabsEl.offsetHeight;
			tabsEl.style.transition = "";
		}
	}

	function finishFlip() {
		window.clearTimeout(settleTimer);
		items.forEach(function (item) {
			if (item.classList.contains("is-filter-leave")) {
				item.hidden = true;
				item.setAttribute("aria-hidden", "true");
			}
		});
		items.forEach(resetItemStyles);
		if (grid) {
			grid.style.minHeight = "";
		}
		root.classList.remove("is-filtering");
		pauseHiddenVideos();
		markLastRow();
		animating = false;
	}

	function startFlip(filter) {
		const nextVisible = items.filter(function (item) {
			return matchesFilter(item, filter);
		});
		const currentlyVisible = items.filter(function (item) {
			return !item.hidden;
		});
		const same =
			nextVisible.length === currentlyVisible.length &&
			nextVisible.every(function (item, index) {
				return item === currentlyVisible[index];
			});

		if (same) {
			activeFilter = filter;
			animating = false;
			return;
		}

		window.clearTimeout(settleTimer);
		animating = true;
		items.forEach(resetItemStyles);
		root.classList.add("is-filtering");

		const first = new Map();
		const gridRect = grid.getBoundingClientRect();
		currentlyVisible.forEach(function (item) {
			first.set(item, item.getBoundingClientRect());
		});

		const leaving = currentlyVisible.filter(function (item) {
			return nextVisible.indexOf(item) === -1;
		});
		const entering = nextVisible.filter(function (item) {
			return currentlyVisible.indexOf(item) === -1;
		});
		const staying = nextVisible.filter(function (item) {
			return currentlyVisible.indexOf(item) !== -1;
		});

		leaving.forEach(function (item) {
			const rect = first.get(item);
			if (!rect) {
				return;
			}
			item.style.position = "absolute";
			item.style.left = rect.left - gridRect.left + grid.scrollLeft + "px";
			item.style.top = rect.top - gridRect.top + grid.scrollTop + "px";
			item.style.width = rect.width + "px";
			item.style.margin = "0";
			item.style.zIndex = "2";
		});

		entering.forEach(function (item) {
			item.style.opacity = "0";
			item.style.transform = "translateY(1.5rem)";
			item.style.transition = "none";
			item.hidden = false;
			item.setAttribute("aria-hidden", "false");
		});

		if (empty) {
			empty.hidden = nextVisible.length > 0;
		}

		markLastRow();

		const afterRect = grid.getBoundingClientRect();
		grid.style.minHeight = Math.max(gridRect.height, afterRect.height) + "px";

		staying.forEach(function (item) {
			const prev = first.get(item);
			if (!prev) {
				return;
			}
			const last = item.getBoundingClientRect();
			const dx = prev.left - last.left;
			const dy = prev.top - last.top;
			item.style.transition = "none";
			if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
				item.style.transform = "translate(" + dx + "px, " + dy + "px)";
			}
		});

		void grid.offsetWidth;

		const duration = moveMs / 1000 + "s";
		const ease = "cubic-bezier(0.16, 1, 0.3, 1)";
		const staggerStep = 28;
		const staggerMax = 6;

		window.requestAnimationFrame(function () {
			leaving.forEach(function (item, index) {
				const delay = Math.min(index, staggerMax) * (staggerStep * 0.6);
				item.style.transitionDelay = delay + "ms";
				item.classList.add("is-filter-leave");
			});

			staying.forEach(function (item) {
				if (!item.style.transform) {
					return;
				}
				item.style.transition = "transform " + duration + " " + ease;
				item.style.transform = "";
			});

			entering.forEach(function (item, index) {
				const delay = Math.min(index, staggerMax) * staggerStep;
				item.style.transition = "opacity " + duration + " ease " + delay + "ms, transform " + duration + " " + ease + " " + delay + "ms";
				item.style.opacity = "1";
				item.style.transform = "";
			});
		});

		activeFilter = filter;

		const maxDelay = Math.min(Math.max(leaving.length, entering.length) - 1, staggerMax) * staggerStep;
		settleTimer = window.setTimeout(finishFlip, moveMs + maxDelay + 40);
	}

	function applyFilter(filter) {
		if (reduceMotion.matches || !grid) {
			clearFilterStyles();
			activeFilter = filter;
			syncVisibility(filter);
			return;
		}

		if (animating) {
			finishFlip();
		}

		if (filter === activeFilter) {
			return;
		}

		startFlip(filter);
	}

	function activate(tab) {
		collapseFilterMenu();

		tabs.forEach(function (item) {
			const selected = item === tab;
			item.setAttribute("aria-selected", selected ? "true" : "false");
			item.tabIndex = selected ? 0 : -1;
		});
		applyFilter(tab.getAttribute("data-filter") || "all");

		const current = root.querySelector("[data-filter-current]");
		if (current) {
			current.textContent = tab.textContent.replace(/\s+/g, " ").trim();
		}
	}

	tabs.forEach(function (tab, index) {
		tab.addEventListener("click", function () {
			activate(tab);
		});

		tab.addEventListener("keydown", function (event) {
			let next = null;
			if (event.key === "ArrowRight") {
				next = tabs[(index + 1) % tabs.length];
			} else if (event.key === "ArrowLeft") {
				next = tabs[(index - 1 + tabs.length) % tabs.length];
			} else if (event.key === "Home") {
				next = tabs[0];
			} else if (event.key === "End") {
				next = tabs[tabs.length - 1];
			}

			if (!next) {
				return;
			}

			event.preventDefault();
			next.focus();
			activate(next);
		});
	});

	markLastRow();

	let resizeTimer = 0;
	window.addEventListener("resize", function () {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(markLastRow, 120);
	});
})();

(function () {
	const thumbs = document.querySelectorAll(".projeto-thumb");

	function pauseAll(except) {
		thumbs.forEach(function (thumb) {
			const video = thumb.querySelector("video");
			if (video && video !== except) {
				video.pause();
				video.currentTime = 0;
				thumb.classList.remove("is-preview-playing");
			}
		});
	}

	thumbs.forEach(function (thumb) {
		const video = thumb.querySelector("video");
		if (!video) {
			return;
		}

		function startPreview() {
			if (document.body.classList.contains("projeto-modal-open")) {
				return;
			}
			thumb.classList.remove("is-preview-suppressed");
			thumb.classList.add("is-preview-playing");
			pauseAll(video);
			const play = video.play();
			if (play && typeof play.catch === "function") {
				play.catch(function () {});
			}
		}

		function stopPreview() {
			video.pause();
			video.currentTime = 0;
			thumb.classList.remove("is-preview-playing");
			if (!document.body.classList.contains("projeto-modal-open")) {
				thumb.classList.remove("is-preview-suppressed");
			}
		}

		function playFromFocus() {
			if (thumb.classList.contains("is-preview-suppressed")) {
				return;
			}
			startPreview();
		}

		const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

		thumb.addEventListener("mouseenter", function () {
			if (finePointer.matches) {
				startPreview();
			}
		});
		thumb.addEventListener("mouseleave", function () {
			if (finePointer.matches) {
				stopPreview();
			}
		});
		thumb.addEventListener("focusin", playFromFocus);
		thumb.addEventListener("focusout", stopPreview);
	});
})();
