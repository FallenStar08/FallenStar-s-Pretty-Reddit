// ==UserScript==
// @name        Reddit Grid view
// @version     1.0.3
// @description Split posts into X columns
// @match       https://old.reddit.com/*
// @author      FallenStar
// @downloadURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/pr-grid.user.js
// @updateURL 	https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/pr-grid.user.js
// @grant       none
// ==/UserScript==
(function () {
	"use strict";

	const columns = 2;
	const minWidthForColumns = 750;

	const style = document.createElement("style");
	style.textContent = `
	@media(min-width:${minWidthForColumns}px) {
		.content>.sitetable{
			position: relative!important;
			display: block!important;
		}
		.content>.sitetable > .thing {
			position: absolute!important;
			width: calc((100% - ${(columns - 1) * 10}px) / ${columns})!important;
			margin-bottom: 10px!important;
		}
	}
	@media(max-width:${minWidthForColumns - 1}px) {
		.content>.sitetable{
			display:block!important;
		}
		.content>.sitetable > .thing {
			position: static!important;
			width: 100%!important;
		}
	}
	.clearleft{display:none!important;}
	.sitetable>.sitetable{display:block!important;}`;
	document.head.appendChild(style);

	// Masonry layout function
	function masonryLayout() {
		if (window.innerWidth < minWidthForColumns) return;

		const container = document.querySelector(".content > .sitetable");
		if (!container) return;

		const items = container.querySelectorAll(".thing");
		if (items.length === 0) return;

		const columnHeights = new Array(columns).fill(0);
		const gap = 10;
		const containerWidth = container.offsetWidth;
		const itemWidth = (containerWidth - (columns - 1) * gap) / columns;

		items.forEach((item, index) => {
			// Find shortest column
			const shortestColumn = columnHeights.indexOf(
				Math.min(...columnHeights)
			);

			// Position item
			const x = shortestColumn * (itemWidth + gap);
			const y = columnHeights[shortestColumn];

			item.style.left = x + "px";
			item.style.top = y + "px";
			item.style.width = itemWidth + "px";

			// Update column height
			columnHeights[shortestColumn] += item.offsetHeight + gap;
		});

		// Set container height
		container.style.height = Math.max(...columnHeights) + "px";
	}

	function fixPostsDisplay() {
		const currentUrl = window.location.href;
		const re =
			/https?:\/\/(old\.|www\.)?reddit\.com\/r\/[^\/]+\/comments\/[^\/]+\/[^\/]*\//;
		if (re.test(currentUrl)) return;

		const targetContainer = document.querySelector(".content > .sitetable");
		if (!targetContainer) return;

		const nestedContainers = document.querySelectorAll(
			".sitetable > .sitetable"
		);
		nestedContainers.forEach((container) => {
			Array.from(container.children).forEach((child) => {
				targetContainer.appendChild(child);
			});
			container.remove();
		});
	}

	function initMasonry() {
		fixPostsDisplay();
		setTimeout(() => {
			masonryLayout();
		}, 200);
	}

	window.addEventListener("load", () => {
		initMasonry();

		// Handle dynamic content loading
		document.addEventListener("DOMNodeInserted", function (e) {
			if (
				e.target.classList &&
				e.target.classList.contains("sitetable")
			) {
				setTimeout(initMasonry, 100);
			}
		});
	});

	// Re-layout on window resize
	window.addEventListener("resize", () => {
		setTimeout(masonryLayout, 100);
	});

	// Handle RES infinite scroll
	window.addEventListener("RESLoadNewPage", () => {
		setTimeout(initMasonry, 300);
	});
})();
