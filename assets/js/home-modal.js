(function () {
	const modal = document.getElementById("projeto-modal");
	if (!modal) {
		return;
	}

	const videoSlot = modal.querySelector("[data-projeto-modal-video]");
	const contentSlot = modal.querySelector("[data-projeto-modal-content]");
	const closeEls = modal.querySelectorAll("[data-projeto-close]");
	const titleEl = modal.querySelector("#projeto-modal-title");
	let lastFocus = null;

	function pauseThumbVideos() {
		document.querySelectorAll(".projeto-thumb").forEach(function (thumb) {
			thumb.classList.add("is-preview-suppressed");
			thumb.classList.remove("is-preview-playing");
			const video = thumb.querySelector("video");
			if (video) {
				video.pause();
				video.currentTime = 0;
			}
		});
	}

	function stopModalMedia() {
		modal.querySelectorAll("video").forEach(function (video) {
			video.pause();
			video.removeAttribute("src");
			video.load();
		});
		modal.querySelectorAll("iframe").forEach(function (iframe) {
			iframe.src = "";
		});
	}

	function closeModal() {
		if (modal.hidden) {
			return;
		}

		stopModalMedia();
		if (videoSlot) {
			videoSlot.replaceChildren();
		}
		if (contentSlot) {
			contentSlot.replaceChildren();
		}

		modal.hidden = true;
		document.body.classList.remove("projeto-modal-open");
		document.documentElement.classList.remove("projeto-modal-open");

		if (lastFocus && typeof lastFocus.focus === "function") {
			lastFocus.focus();
		}
		lastFocus = null;
	}

	function openModal(id, trigger) {
		const tpl = document.getElementById("projeto-modal-" + id);
		if (!tpl) {
			return;
		}

		pauseThumbVideos();

		const sourceVideo = tpl.content.querySelector("[data-slot=video]");
		const sourceContent = tpl.content.querySelector("[data-slot=content]");

		if (videoSlot && sourceVideo) {
			videoSlot.replaceChildren(sourceVideo.cloneNode(true));
		}
		if (contentSlot && sourceContent) {
			contentSlot.replaceChildren(sourceContent.cloneNode(true));
		}

		const name = trigger ? trigger.querySelector(".projeto-thumb__name") : null;
		if (titleEl) {
			titleEl.textContent = name ? name.textContent : "Projeto";
		}

		lastFocus = trigger || document.activeElement;
		modal.hidden = false;
		document.body.classList.add("projeto-modal-open");
		document.documentElement.classList.add("projeto-modal-open");

		const closeBtn = modal.querySelector(".projeto-modal__close");
		if (closeBtn) {
			closeBtn.focus();
		}

		const modalVideo = videoSlot ? videoSlot.querySelector("video") : null;
		if (modalVideo) {
			const play = modalVideo.play();
			if (play && typeof play.catch === "function") {
				play.catch(function () {});
			}
		}
	}

	document.querySelectorAll("[data-projeto-open]").forEach(function (thumb) {
		thumb.addEventListener("click", function (event) {
			event.preventDefault();
			openModal(thumb.getAttribute("data-projeto-open"), thumb);
		});
	});

	closeEls.forEach(function (el) {
		el.addEventListener("click", function (event) {
			event.preventDefault();
			closeModal();
		});
	});

	modal.addEventListener("click", function (event) {
		if (modal.hidden) {
			return;
		}

		if (event.target.closest(".projeto-modal__close")) {
			return;
		}

		const keepOpen = event.target.closest(
			"video, iframe, .projeto-modal__media, [data-slot='content'], .projeto-conteudo"
		);
		if (keepOpen) {
			return;
		}

		closeModal();
	});

	document.addEventListener("keydown", function (event) {
		if (event.key === "Escape" && !modal.hidden) {
			closeModal();
		}
	});
})();
