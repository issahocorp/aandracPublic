(function () {
	const buttons = Array.from(document.querySelectorAll(".icon-toggle[aria-controls]"));
	if (!buttons.length) {
		return;
	}

	const mq = window.matchMedia("(max-width: 800px)");

	function setOpen(button, open) {
		button.setAttribute("aria-expanded", open ? "true" : "false");
		const label = open ? button.getAttribute("data-close-label") : button.getAttribute("data-open-label");
		if (label) {
			button.setAttribute("aria-label", label);
		}
	}

	function closeAll(except) {
		buttons.forEach(function (button) {
			if (button !== except) {
				setOpen(button, false);
			}
		});
	}

	function isOpen(button) {
		return "true" === button.getAttribute("aria-expanded");
	}

	buttons.forEach(function (button) {
		if (!button.getAttribute("data-open-label")) {
			button.setAttribute("data-open-label", button.getAttribute("aria-label") || "");
		}
		if (!button.getAttribute("data-close-label")) {
			button.setAttribute(
				"data-close-label",
				button.classList.contains("filter-toggle") ? "Fechar categorias" : "Fechar menu"
			);
		}

		button.addEventListener("click", function (event) {
			event.stopPropagation();
			if (!mq.matches) {
				return;
			}
			const open = !isOpen(button);
			closeAll(button);
			setOpen(button, open);
		});
	});

	document.addEventListener("click", function (event) {
		if (!mq.matches) {
			return;
		}
		const inside = event.target.closest(".icon-toggle, .site-navigation, .home-projetos__tabs");
		if (!inside) {
			closeAll();
		}
	});

	document.addEventListener("keydown", function (event) {
		if ("Escape" === event.key) {
			closeAll();
		}
	});

	function onViewportChange() {
		if (!mq.matches) {
			closeAll();
		}
	}

	if (typeof mq.addEventListener === "function") {
		mq.addEventListener("change", onViewportChange);
	} else if (typeof mq.addListener === "function") {
		mq.addListener(onViewportChange);
	}

	window.aandracCloseToggles = closeAll;
})();
