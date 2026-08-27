(function () {
	const header = document.querySelector(".site-header");
	if (!header) {
		return;
	}

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const placeholder = document.createElement("div");
	placeholder.className = "site-header-placeholder";
	placeholder.setAttribute("aria-hidden", "true");
	header.parentNode.insertBefore(placeholder, header);

	const sentinel = document.createElement("div");
	sentinel.className = "site-header-sentinel";
	sentinel.setAttribute("aria-hidden", "true");
	header.parentNode.insertBefore(sentinel, header.nextSibling);

	function clearInlineMotion() {
		header.style.transition = "";
		header.style.transform = "";
		header.style.transformOrigin = "";
	}

	function stick() {
		if (document.body.classList.contains("has-compact-header")) {
			return;
		}

		const first = header.getBoundingClientRect();
		placeholder.style.height = first.height + "px";
		header.style.transition = "none";
		document.body.classList.add("has-compact-header");

		if (typeof window.aandracCloseToggles === "function") {
			window.aandracCloseToggles();
		}

		if (reduceMotion.matches) {
			return;
		}

		const last = header.getBoundingClientRect();
		const dy = first.top - last.top;
		const sy = last.height ? first.height / last.height : 1;

		header.style.transition = "none";
		header.style.transformOrigin = "top center";
		header.style.transform = "translateY(" + dy + "px) scaleY(" + sy + ")";
		void header.offsetWidth;
		header.style.transition = "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)";
		header.style.transform = "none";

		header.addEventListener(
			"transitionend",
			function onEnd(event) {
				if (event.target !== header || event.propertyName !== "transform") {
					return;
				}
				clearInlineMotion();
				header.removeEventListener("transitionend", onEnd);
			}
		);
	}

	function unstick() {
		if (!document.body.classList.contains("has-compact-header")) {
			return;
		}
		clearInlineMotion();
		document.body.classList.remove("has-compact-header");
		placeholder.style.height = "";
	}

	if (!("IntersectionObserver" in window)) {
		return;
	}

	const observer = new IntersectionObserver(
		function (entries) {
			const entry = entries[0];
			if (entry.boundingClientRect.top < 0) {
				stick();
			} else {
				unstick();
			}
		},
		{
			threshold: 0,
		}
	);

	observer.observe(sentinel);
})();
