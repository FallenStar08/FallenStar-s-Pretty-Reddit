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

	style.textContent = `@media(min-width:${minWidthForColumns}px)
	{
	.content>.sitetable{display:grid!important;grid-template-columns:repeat(${columns},1fr)!important;}}
	@media(max-width:${minWidthForColumns - 1}px)
	{
	.content>.sitetable{display:block!important;grid-template-columns:1fr!important;}}
	.clearleft{display:none!important;}
	.sitetable>.sitetable{display:block!important;}`;
	document.head.appendChild(style);

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

	window.addEventListener("load", () => {
		setTimeout(fixPostsDisplay, 100);
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
