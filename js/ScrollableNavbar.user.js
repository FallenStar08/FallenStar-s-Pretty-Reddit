// ==UserScript==
// @name        ScrollableNavbar
// @match       https://old.reddit.com/*
// @version     1.0
// @author      FallenStar
// @run-at   document-end
// @downloadURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/NavBarFixes.user.js
// @updateURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/NavBarFixes.user.js
// @description 9/28/2024, 8:22:44 AM
// ==/UserScript==

(function () {
	"use strict";

	var navbar = document.getElementById("sr-header-area");

	function attachEventListener() {
		const srHeaderArea = document.getElementById("sr-header-area");
		if (srHeaderArea) {
			srHeaderArea.addEventListener("mouseover", handleMouseOver);
			dbg(
				"Debug: Event listener attached to element with id 'sr-header-area'"
			);
		} else {
			dbg("Debug: Element with id 'sr-header-area' not found.");
		}
	}

	function removeEventListener() {
		const srHeaderArea = document.getElementById("sr-header-area");
		if (srHeaderArea) {
			srHeaderArea.removeEventListener("mouseover", handleMouseOver);
			dbg(
				"Debug: Event listener removed from element with id 'sr-header-area'"
			);
		}
	}

	// For some reason I need this to get some scrolling
	function handleMouseOver(event) {
		const srHeaderArea = event.currentTarget;
		const resShortcutsViewport = document.getElementById(
			"RESShortcutsViewport"
		);

		if (resShortcutsViewport) {
			srHeaderArea.addEventListener("wheel", handleWheelEvent);
		}
	}

	function handleWheelEvent(event) {
		event.preventDefault();
		const resShortcutsViewport = document.getElementById(
			"RESShortcutsViewport"
		);

		if (resShortcutsViewport) {
			resShortcutsViewport.scrollLeft += event.deltaY;
		}
	}

	window.addEventListener("load", function () {
		attachEventListener();
		setStyle();

		// Idk why this fucking navbar even mutates I stg
		const observer = new MutationObserver(function (mutations) {
			dbg("Debug: MutationObserver detected changes");
			mutations.forEach(function (mutation) {
				dbg("Debug: Mutation type:", mutation.type);
				dbg("Debug: Added nodes:", mutation.addedNodes);
				dbg("Debug: Removed nodes:", mutation.removedNodes);

				// check if the element is being replaced in-place
				if (
					mutation.type === "childList" ||
					mutation.type === "subtree" ||
					mutation.type === "attributes"
				) {
					const srHeaderArea =
						document.getElementById("sr-header-area");
					if (srHeaderArea) {
						removeEventListener();
						attachEventListener();
					}
				}
			});
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["id"],
		});
	});
})();
