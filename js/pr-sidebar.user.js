// ==UserScript==
// @name        Collapsible Sidebar
// @version     2.1.0
// @description Collapse the sidebar until the mouse is near the edge, with smooth animation and a visible trigger zone
// @match       https://old.reddit.com/*
// @author      FallenStar
// @downloadURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/pr-sidebar.user.js
// @updateURL 	https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/pr-sidebar.user.js
// @grant       none
// ==/UserScript==

(function () {
	"use strict";

	let sidebar = document.querySelector(".side");
	let sortMenu = null;
	let sortButton = null;
	if (!sidebar) return;
	function positionSortMenu() {
		if (sortMenu && sortButton) {
			const rect = sortButton.getBoundingClientRect();

			sortMenu.style.position = "fixed";

			sortMenu.style.left = `${
				rect.left + rect.width / 2 - sortMenu.offsetWidth / 2
			}px`;

			sortMenu.style.top = `${rect.bottom + 5}px`;

			sortMenu.style.display = "block";
		}
	}

	function addItemsToSidebar() {
		var container = document.createElement("div");
		container.style.display = "flex";
		container.style.flexDirection = "column";
		container.style.width = "100%";
		container.style.padding = "10px";
		container.style.boxSizing = "border-box";

		const label = document.createElement("span");
		label.textContent = "NavBar actions :";
		label.style.fontSize = "16px";
		label.style.marginBottom = "10px";
		label.style.color = "white";
		container.appendChild(label);

		const buttonContainer = document.createElement("div");
		buttonContainer.style.display = "flex";
		buttonContainer.style.justifyContent = "space-between";
		buttonContainer.style.width = "100%";
		buttonContainer.style.marginTop = "5px";

		var sortDiv = document.getElementById("RESShortcutsSort");
		var addDiv = document.getElementById("RESShortcutsAdd");

		sortButton = document.createElement("button");
		sortButton.textContent = "Sort";
		sortButton.className = "fallen-sort";

		sortButton.style.flex = "1";
		sortButton.style.marginRight = "5px";
		sortButton.style.padding = "5px";
		sortButton.style.fontSize = "12px";
		sortButton.style.border = "none";
		sortButton.style.backgroundColor = "#555";
		sortButton.style.color = "white";
		sortButton.style.cursor = "pointer";
		sortButton.style.display = "flex";
		sortButton.style.justifyContent = "center";
		sortButton.style.alignItems = "center";
		sortButton.style.maxWidth = "100px";

		const addButton = document.createElement("button");
		addButton.textContent = "Add";
		addButton.className = "fallen-add";

		addButton.style.flex = "1";
		addButton.style.marginLeft = "5px";
		addButton.style.padding = "5px";
		addButton.style.fontSize = "12px";
		addButton.style.border = "none";
		addButton.style.backgroundColor = "#555";
		addButton.style.color = "white";
		addButton.style.cursor = "pointer";
		addButton.style.display = "flex";
		addButton.style.justifyContent = "center";
		addButton.style.alignItems = "center";
		addButton.style.maxWidth = "100px";

		addButton.addEventListener("click", function () {
			addDiv.click();
		});
		let clickX = 0;
		let clickY = 0;
		sortButton.addEventListener("click", function (event) {
			clickX = event.clientX;
			clickY = event.clientY;

			if (!sortMenu) {
				observeSortMenu();
			}

			sortDiv.click();
		});

		function observeSortMenu() {
			const observer = new MutationObserver((mutations) => {
				for (let mutation of mutations) {
					if (mutation.type === "childList") {
						const menu = document.getElementById("sort-menu");
						if (menu) {
							sortMenu = menu;

							positionSortMenu();

							console.log("Menu positioned under cursor");
						}
					}
				}
			});

			observer.observe(document.body, { childList: true, subtree: true });
		}

		buttonContainer.appendChild(sortButton);
		buttonContainer.appendChild(addButton);

		container.appendChild(buttonContainer);

		sidebar.prepend(container);
	}

	// Sidebar styling
	sidebar.style.position = "fixed";
	sidebar.style.top = "0";
	sidebar.style.right = "0";
	sidebar.style.width = "250px";
	sidebar.style.height = "100%";
	sidebar.style.backgroundColor = "#333";
	sidebar.style.color = "white";
	sidebar.style.display = "block";
	sidebar.style.opacity = "0";
	sidebar.style.pointerEvents = "none";
	sidebar.style.transition = "opacity 0.3s ease-in-out";
	sidebar.style.zIndex = "1000";
	sidebar.style.overflowY = "auto";
	sidebar.style.scrollbarWidth = "none";

	let triggerZone = document.createElement("div");
	triggerZone.style.position = "fixed";
	triggerZone.style.top = "0";
	triggerZone.style.right = "0";
	triggerZone.style.width = "50px";
	triggerZone.style.height = "100%";
	triggerZone.style.backgroundColor = "rgba(255, 255, 255, 0.0)";
	triggerZone.style.zIndex = "9999";
	triggerZone.style.pointerEvents = "none";

	document.body.appendChild(triggerZone);

	addItemsToSidebar();

	function updateTriggerZoneOpacity(distance) {
		let opacity = Math.max(0, (300 - distance) / 300);
		triggerZone.style.backgroundColor = `rgba(255, 255, 255, ${
			opacity * 0.1
		})`;
	}

	function handleMouseMove(e) {
		const rightEdgeDistance = window.innerWidth - e.clientX;

		if (rightEdgeDistance < 50) {
			sidebar.style.opacity = "1";
			sidebar.style.pointerEvents = "auto";
			triggerZone.style.display = "none";
		} else if (rightEdgeDistance > 250) {
			hideSidebar();
		}

		updateTriggerZoneOpacity(rightEdgeDistance);
	}

	function hideSidebar() {
		sidebar.style.opacity = "0";
		sidebar.style.pointerEvents = "none";
		triggerZone.style.display = "block";
	}

	function handleMouseOut(e) {
		if (!e.relatedTarget) {
			hideSidebar();
		}
	}

	document.addEventListener("mousemove", handleMouseMove);
	document.addEventListener("mouseout", handleMouseOut, true); // Detect when mouse leaves the window
})();
