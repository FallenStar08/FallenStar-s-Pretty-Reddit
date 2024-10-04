// ==UserScript==
// @name        Floating Sorting Panel
// @namespace   Violentmonkey Scripts
// @match       https://old.reddit.com/*
// @exclude-match https://old.reddit.com/r/*/comments/*
// @grant       none
// @version     1.3
// @author      FallenStar
// @description Adds sorting options as a floating panel on Reddit with hover sliding effect and hidden overflow.
// ==/UserScript==

(function () {
	"use strict";

	const currentUrl = window.location.href;
	// replace already sorted url with base one
	const baseUrl = currentUrl.replace(
		/\/(new|top|hot|controversial|rising)\/?$/,
		"/"
	);

	async function checkSubredditExists(subreddit) {
		const url = `https://old.reddit.com/r/${subreddit}/about.json`;
		const response = await fetch(url, {
			method: "HEAD",
		});
		return response.status === 200;
	}

	// sorting pannel element
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
		boxShadow: "0 4px 8px rgba(0, 0, 0, .1)",
		zIndex: "9999",
		color: "#fff",
		maxWidth: "15vw",
	});

	// Sorting links list
	const sortingOptions = [
		{
			text: "Hot",
			sort: "hot",
		},
		{
			text: "New",
			sort: "new",
		},
		{
			text: "Top",
			sort: "top",
		},
		{
			text: "Contro", //rename to something shorter idk
			sort: "controversial",
		},
		{
			text: "Rising",
			sort: "rising",
		},
	];

	// Container for the input and icon
	const inputContainer = document.createElement("div");
	inputContainer.style.position = "relative";

	panel.appendChild(inputContainer);

	// Search input
	const searchInput = document.createElement("input");
	searchInput.classList.add("js-search");
	searchInput.placeholder = "Go to...";
	Object.assign(searchInput.style, {
		backgroundColor: "rgba(0, 0, 0, 0) !important",
		backdropFilter: "blur(10px)",
		borderRadius: "0px",
		margin: "0px",
		border: "0px",
		color: "white",
		padding: "5px",
		fontSize: "12px",
		width: "50px",
		overflow: "auto",
	});

	// Search Result Icon
	const iconContainer = document.createElement("div");
	iconContainer.id = "iconContainer";
	iconContainer.style.position = "absolute";
	iconContainer.style.right = "5px";
	iconContainer.style.top = "50%";
	iconContainer.style.transform = "translateY(-50%)";
	iconContainer.style.fontSize = "20px";

	inputContainer.appendChild(searchInput);
	inputContainer.appendChild(iconContainer);

	// Add links to pannel
	sortingOptions.forEach((option) => {
		const anchor = document.createElement("a");
		anchor.href = `${baseUrl}${option.sort}/`;
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

		// Probably should use css but yolo
		anchor.addEventListener("mouseover", () => {
			anchor.style.transform = "translateX(10px)";
		});

		anchor.addEventListener("mouseout", () => {
			anchor.style.backgroundColor = "transparent";
			anchor.style.transform = "translateX(0)";
		});

		panel.appendChild(anchor);
	});

	/* Events stuff */

	let typingTimer;
	const doneTypingInterval = 300;

	// Check for Enter key press
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

	// Check if subreddit exists when typing stops
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

	// Hide the icon while typing
	searchInput.addEventListener("input", () => {
		iconContainer.style.visibility = "hidden";
	});

	// Dynamically adjust input width
	searchInput.addEventListener("input", () => {
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
})();
