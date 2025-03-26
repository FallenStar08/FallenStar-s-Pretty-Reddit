// ==UserScript==
// @name        Reddit Grid view
// @version     1.0.0
// @description Split posts into X columns
// @match       https://old.reddit.com/*
// @author      FallenStar
// @downloadURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/RedditGridView.user.js
// @updateURL 	https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/RedditGridView.user.js
// @grant       none
// ==/UserScript==

(function () {
	"use strict";
	const columns = 2;
	const minWidthForColumns = 800; // Minimum width in pixels for multi-column layout

	function fixPostsDisplay() {
		const currentUrl = window.location.href;
		const re =
			/https?:\/\/(old\.|www\.)?reddit\.com\/r\/[^\/]+\/comments\/[^\/]+\/[^\/]*\//;
		// Checking if the current URL matches the Reddit comment page pattern
		const isRedditCommentPage = re.test(currentUrl);
		if (isRedditCommentPage) {
			return;
		}

		//invisible element that fucks up grid
		var clearLeft = document.querySelectorAll(".clearleft");
		clearLeft.forEach((element) =>
			element.style.setProperty("display", "none", "important")
		);

		const targetContainer = document.querySelector(".content > .sitetable");
		if (!targetContainer) {
			console.log("Target container not found");
			return;
		}

		// Check viewport width and apply appropriate layout
		applyResponsiveLayout(targetContainer);

		const nestedContainers = document.querySelectorAll(
			".sitetable > .sitetable"
		);
		nestedContainers.forEach((element) =>
			element.style.setProperty("display", "block", "important")
		);

		if (nestedContainers.length === 0) {
			console.log("No nested posts found");
			return;
		}

		console.log(`Found ${nestedContainers.length} nested posts containers`);
		nestedContainers.forEach((container) => {
			const children = Array.from(container.children);
			children.forEach((child) => {
				targetContainer.appendChild(child);
			});
			if (container.parentNode) {
				container.parentNode.removeChild(container);
			}
		});
	}

	function applyResponsiveLayout(targetContainer) {
		if (window.innerWidth >= minWidthForColumns) {
			// Multi-column layout for wider screens
			targetContainer.style.setProperty("display", "grid", "important");
			const templateColumnsAmount = "1fr ".repeat(columns);
			targetContainer.style.gridTemplateColumns = templateColumnsAmount;
		} else {
			// Single column layout for smaller screens
			targetContainer.style.setProperty("display", "block", "important");
			targetContainer.style.gridTemplateColumns = "1fr";
		}
	}

	// Initial setup
	window.addEventListener("load", function () {
		setTimeout(fixPostsDisplay, 100);

		// Run when navigating between pages without a full reload (Reddit's AJAX navigation)
		document.addEventListener("DOMNodeInserted", function (e) {
			if (
				e.target.classList &&
				e.target.classList.contains("sitetable")
			) {
				setTimeout(fixPostsDisplay, 100);
			}
		});

		// Add resize listener to handle viewport width changes
		window.addEventListener("resize", function () {
			const targetContainer = document.querySelector(
				".content > .sitetable"
			);
			if (targetContainer) {
				applyResponsiveLayout(targetContainer);
			}
		});
	});
})();
