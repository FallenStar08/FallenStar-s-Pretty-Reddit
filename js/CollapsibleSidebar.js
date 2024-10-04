// ==UserScript==
// @name        Collapsible Sidebar
// @version     1.1
// @description Collapse the sidebar until the mouse is near the edge, with smooth animation and a visible trigger zone
// @match       https://old.reddit.com/*
// @author      FallenStar
// @grant       none
// ==/UserScript==

(function () {
	"use strict";

	let sidebar = document.querySelector(".side");
	if (!sidebar) return;

	// sidebar styling
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

	// Trigger zone
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

	//update the opacity of the trigger zone based on mouse position
	function updateTriggerZoneOpacity(distance) {
		let opacity = Math.max(0, (300 - distance) / 300);
		triggerZone.style.backgroundColor = `rgba(255, 255, 255, ${
			opacity * 0.1
		})`;
	}

	//show/hide the sidebar smoothly and adjust the trigger zone
	function handleMouseMove(e) {
		const rightEdgeDistance = window.innerWidth - e.clientX;

		// Show
		if (rightEdgeDistance < 50) {
			sidebar.style.opacity = "1";
			sidebar.style.pointerEvents = "auto"; // Enable interactions
			triggerZone.style.display = "none";
		}
		// Hide
		else if (rightEdgeDistance > 250) {
			sidebar.style.opacity = "0";
			sidebar.style.pointerEvents = "none"; // Disable interactions
			triggerZone.style.display = "block";
		}

		// Update opacity trigger zone
		updateTriggerZoneOpacity(rightEdgeDistance);
	}

	document.addEventListener("mousemove", handleMouseMove);
})();
