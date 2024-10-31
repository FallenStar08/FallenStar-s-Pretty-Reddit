// ==UserScript==
// @name        Floating Sorting Panel
// @namespace   Violentmonkey Scripts
// @match       https://old.reddit.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @version     2.5.0
// @author      FallenStar
// @downloadURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/FloatingPanel.user.js
// @updateURL   https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/FloatingPanel.user.js
// @description Adds sorting options as a floating panel on Reddit with hover sliding effect, hidden overflow, drag-and-drop functionality
// ==/UserScript==

(function () {
	"use strict";
	const DEFAULT_LEFT = "1%";
	const DEFAULT_TOP = "50%";

	const panel = document.createElement("div");
	panel.id = "floating-nav-panel";
	Object.assign(panel.style, {
		position: "fixed",
		top: "50%",
		left: "1%",
		transform: "translateY(-50%)",
		backgroundColor: "rgba(48, 51, 50, .38)",
		backdropFilter: "blur(10px)",
		borderRadius: "12px",
		padding: "10px",
		boxShadow: "0 0 1px rgba(255, 255, 255, 0.3)",
		zIndex: "9999",
		color: "#fff",
		maxWidth: "15vw",
		cursor: "move",
	});

	//Restore panel position from previous session
	const savedLeft = GM_getValue("panelLeft", DEFAULT_LEFT);
	const savedTop = GM_getValue("panelTop", DEFAULT_TOP);
	panel.style.left =
		typeof savedLeft === "number" ? `${savedLeft}px` : savedLeft;
	panel.style.top = typeof savedTop === "number" ? `${savedTop}px` : savedTop;

	// reset position userscript menu entry
	GM_registerMenuCommand("Reset Panel Position", () => {
		panel.style.left = DEFAULT_LEFT;
		panel.style.top = DEFAULT_TOP;
		panel.style.transform = "translateY(-50%)";

		GM_setValue("panelLeft", DEFAULT_LEFT);
		GM_setValue("panelTop", DEFAULT_TOP);

		alert("Panel position reset to default.");
	});

	const currentUrl = window.location.href;
	const isCommentPage =
		/https:\/\/old\.reddit\.com\/r\/.*\/comments\/.*\/.*/.test(currentUrl);
	const isUserProfilePage =
		/https:\/\/old\.reddit\.com\/user\/[^/]+(\/(comments|submitted)\/?)?\/?(\?.*)?$/.test(
			currentUrl
		);
	const isSubredditTopPage =
		/https:\/\/old\.reddit\.com\/r\/[^/]+\/top\/?.*/.test(currentUrl);

	const baseUrl =
		isCommentPage || isUserProfilePage
			? currentUrl.replace(/\?sort=.*$/, "")
			: isSubredditTopPage
			? currentUrl.replace(/\/top\/?.*$/, "/")
			: currentUrl.replace(
					/\/(new|top|hot|controversial|rising)\/?$/,
					"/"
			  );

	const sortingOptions = isUserProfilePage
		? [
				{ text: "New", sort: "new" },
				{ text: "Top", sort: "top" },
				{ text: "Hot", sort: "hot" },
		  ]
		: [
				isCommentPage
					? { text: "Best", sort: "confidence" }
					: { text: "Hot", sort: "hot" },
				{ text: "New", sort: "new" },
				isCommentPage ? { text: "Old", sort: "old" } : {},
				isSubredditTopPage ? {} : { text: "Top", sort: "top" },
				isSubredditTopPage
					? { text: "Top - H", sort: "top/?sort=top&t=hour" }
					: {},
				isSubredditTopPage
					? { text: "Top - D", sort: "top/?sort=top&t=day" }
					: {},
				isSubredditTopPage
					? { text: "Top - W", sort: "top/?sort=top&t=week" }
					: {},
				isSubredditTopPage
					? { text: "Top - M", sort: "top/?sort=top&t=month" }
					: {},
				isSubredditTopPage
					? { text: "Top - Y", sort: "top/?sort=top&t=year" }
					: {},
				{ text: "Contro", sort: "controversial" },
				isCommentPage
					? { text: "Q&A", sort: "qa" }
					: { text: "Rising", sort: "rising" },
		  ].filter((option) => Object.keys(option).length > 0);

	const inputContainer = document.createElement("div");
	inputContainer.style.position = "relative";

	panel.appendChild(inputContainer);

	const searchInput = document.createElement("input");
	searchInput.classList.add("js-search");
	searchInput.placeholder = "Go to...";
	Object.assign(searchInput.style, {
		backgroundColor: "transparent",
		borderRadius: "0px",
		margin: "0px",
		border: "0px",
		color: "white",
		padding: "5px",
		fontSize: "12px",
		width: "50px",
		overflow: "auto",
	});

	const iconContainer = document.createElement("div");
	iconContainer.id = "iconContainer";
	iconContainer.style.position = "absolute";
	iconContainer.style.right = "5px";
	iconContainer.style.top = "50%";
	iconContainer.style.transform = "translateY(-50%)";
	iconContainer.style.fontSize = "20px";

	inputContainer.appendChild(searchInput);
	inputContainer.appendChild(iconContainer);

	sortingOptions.forEach((option) => {
		const anchor = document.createElement("a");
		const sortUrl =
			isCommentPage || isUserProfilePage
				? `${baseUrl}?sort=${option.sort}`
				: `${baseUrl}${option.sort}`;
		anchor.href = sortUrl;
		anchor.textContent = option.text;
		Object.assign(anchor.style, {
			display: "block",
			color: "#fff",
			textDecoration: "none",
			fontSize: "12px",
			padding: "5px",
			borderRadius: "3px",
			transition: "all 0.3s ease",
			width: "50px",
			overflow: "hidden",
			whiteSpace: "nowrap",
			textOverflow: "ellipsis",
		});

		anchor.addEventListener("mouseover", () => {
			anchor.style.transform = "translateX(10px)";
		});

		anchor.addEventListener("mouseout", () => {
			anchor.style.backgroundColor = "transparent";
			anchor.style.transform = "translateX(0)";
		});

		panel.appendChild(anchor);
	});

	// Drag and drop functionality, now with boundary checks!
	let isDragging = false;
	let offset = { x: 0, y: 0 };

	panel.addEventListener("mousedown", (e) => {
		isDragging = true;
		offset.x = e.clientX - panel.getBoundingClientRect().left;
		offset.y = e.clientY - panel.getBoundingClientRect().top;
	});

	document.addEventListener("mousemove", (e) => {
		if (isDragging) {
			let newX = e.clientX - offset.x;
			let newY = e.clientY - offset.y;
			newX = Math.max(
				0,
				Math.min(newX, window.innerWidth - panel.offsetWidth)
			);
			newY = Math.max(
				panel.offsetHeight / 2,
				Math.min(
					newY + panel.offsetHeight / 2,
					window.innerHeight - panel.offsetHeight / 2
				)
			);
			panel.style.left = `${newX}px`;
			panel.style.top = `${newY}px`;
		}
	});

	document.addEventListener("mouseup", () => {
		if (isDragging) {
			isDragging = false;

			//pos save (haha pos)
			const leftValue = parseInt(panel.style.left, 10);
			const topValue = parseInt(panel.style.top, 10);
			GM_setValue("panelLeft", leftValue);
			GM_setValue("panelTop", topValue);
		}
	});

	let typingTimer;
	const doneTypingInterval = 300;

	searchInput.addEventListener("keydown", async (e) => {
		if (e.code === "Enter") {
			const subreddit = searchInput.value.trim();
			if (subreddit) {
				const exists = await checkSubredditExists(subreddit);
				if (exists) {
					window.location.href = `https://old.reddit.com/r/${subreddit}/`;
				} else {
					console.log("Subreddit does not exist.");
				}
			}
		}
	});

	searchInput.addEventListener("keyup", () => {
		clearTimeout(typingTimer);
		typingTimer = setTimeout(async () => {
			const subreddit = searchInput.value.trim();
			if (subreddit) {
				const exists = await checkSubredditExists(subreddit);
				iconContainer.textContent = exists ? "✔" : "✘";
				iconContainer.style.color = exists ? "green" : "red";
				iconContainer.style.visibility = "visible";
			} else {
				iconContainer.style.visibility = "hidden";
			}
		}, doneTypingInterval);
	});

	searchInput.addEventListener("input", () => {
		iconContainer.style.visibility = "hidden";
		const value = searchInput.value;
		const span = document.createElement("span");
		span.style.position = "absolute";
		span.style.visibility = "hidden";
		span.style.whiteSpace = "nowrap";
		span.style.fontSize = "12px";
		span.textContent = value;
		document.body.appendChild(span);
		const width = span.getBoundingClientRect().width + 20;
		document.body.removeChild(span);
		searchInput.style.width = `${Math.min(Math.max(width, 50), 150)}px`;
	});

	document.body.appendChild(panel);

	async function checkSubredditExists(subreddit) {
		const url = `https://old.reddit.com/r/${subreddit}/about.json`;
		const response = await fetch(url, {
			method: "HEAD",
		});
		return response.status === 200;
	}
})();
