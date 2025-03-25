// ==UserScript==
// @name        FallenStar's Pretty Reddit
// @namespace   Violentmonkey Scripts
// @match       https://old.reddit.com/r/*
// @grant       none
// @version     1.0.1
// @run-at      document-end
// @require     https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/NavBarFixes.user.js
// @require     https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/CollapsibleSidebar.user.js
// @author      FallenStar
// @description Main script for a better reddit
// ==/UserScript==

(function () {
	"use strict";
	const columns = 2;

	function fixPostsDisplay() {
		const currentUrl = window.location.href; // .href is a property, not a function
		const re =
			/https?:\/\/(old\.|www\.)?reddit\.com\/r\/[^\/]+\/comments\/[^\/]+\/[^\/]*\//;

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
		targetContainer.style.setProperty("display", "grid", "important");

		const templateColumnsAmount = "1fr ".repeat(columns);
		targetContainer.style.gridTemplateColumns = templateColumnsAmount;

		if (!targetContainer) {
			console.log("Target container not found");
			return;
		}

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

	window.addEventListener("load", function () {
		setTimeout(fixPostsDisplay, 100);

		// Also run when navigating between pages without a full reload (Reddit's AJAX navigation)
		document.addEventListener("DOMNodeInserted", function (e) {
			if (
				e.target.classList &&
				e.target.classList.contains("sitetable")
			) {
				setTimeout(fixPostsDisplay, 100);
			}
		});
	});
})();
