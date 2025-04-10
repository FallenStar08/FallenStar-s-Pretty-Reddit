// ==UserScript==
// @name        Floating Sorting Panel
// @namespace   Violentmonkey Scripts
// @match       https://old.reddit.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @version     3.1.2
// @author      FallenStar
// @downloadURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/pr-panel.user.js
// @updateURL   https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/pr-panel.user.js
// @description Adds sorting options as a floating panel on Reddit, drag-and-drop functionality, list all searchable flairs & more
// ==/UserScript==

(function () {
	"use strict";
	const NAVBAR_HEIGH = 28;
	const DEFAULT_LEFT = "1%";
	const DEFAULT_TOP = "50%";

	const panel = document.createElement("div");
	panel.id = "floating-nav-panel";
	Object.assign(panel.style, {
		position: "fixed",
		top: "50%",
		left: "1%",
		transform: "translateY(-50%)",
		backgroundColor: "#0000008c",
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

	//clean up this abomination
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
				isSubredditTopPage
					? { text: "Top", sort: "top" }
					: { text: "Top", sort: "top" },
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
		anchor.setAttribute("data-option", option.text);
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

	//SECTION Flair Menu
	const subreddit = window.location.pathname.split("/")[2];
	if (subreddit) {
		const flairDropdown = document.createElement("div");
		flairDropdown.style.display = "none";
		flairDropdown.style.position = "absolute";
		flairDropdown.style.top = "0";
		flairDropdown.style.left = "100%";
		flairDropdown.style.backgroundColor = "rgba(48, 51, 50, .38)";
		flairDropdown.style.backdropFilter = "blur(10px)";
		flairDropdown.style.borderRadius = "12px";
		flairDropdown.style.padding = "10px";
		flairDropdown.style.boxShadow = "0 0 1px rgba(255, 255, 255, 0.3)";
		flairDropdown.style.zIndex = "9999";
		flairDropdown.style.color = "#fff";
		flairDropdown.style.maxWidth = "15vw";
		flairDropdown.style.overflow = "auto";
		flairDropdown.style.maxHeight = "200px";

		const flairAnchor = document.createElement("a");
		flairAnchor.href = "#";
		flairAnchor.textContent = "Flairs >";
		Object.assign(flairAnchor.style, {
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

		flairAnchor.addEventListener("click", (e) => {
			e.preventDefault();
			flairDropdown.style.display =
				flairDropdown.style.display === "none" ? "block" : "none";
		});

		flairAnchor.addEventListener("mouseover", () => {
			flairAnchor.style.transform = "translateX(10px)";
		});

		flairAnchor.addEventListener("mouseout", () => {
			flairAnchor.style.backgroundColor = "transparent";
			flairAnchor.style.transform = "translateX(0)";
		});

		document.addEventListener("click", (e) => {
			if (
				!flairAnchor.contains(e.target) &&
				!flairDropdown.contains(e.target)
			) {
				flairDropdown.style.display = "none";
			}
		});
		panel.appendChild(flairAnchor);
		panel.appendChild(flairDropdown);

		//SECTION Flairs API
		const apiUrl = `https://old.reddit.com/r/${subreddit}/api/link_flair.json`;

		GM_xmlhttpRequest({
			method: "GET",
			url: apiUrl,
			onload: function (response) {
				try {
					const flairs = JSON.parse(response.responseText);
					if (!flairs || flairs.length === 0) {
						flairDropdown.innerHTML = "<p>No flairs found.</p>";
						return;
					}

					flairs.forEach((flair) => {
						const flairAnchor = document.createElement("a");
						const encodedFlair = encodeURIComponent(
							flair.text.replace(/\s+/g, "+")
						);
						flairAnchor.href = `https://old.reddit.com/r/${subreddit}/search?q=flair%3A${encodedFlair}`;
						//flairAnchor.target = "_blank"; // to open in new tab, maybe an option
						flairAnchor.textContent = flair.text;

						Object.assign(flairAnchor.style, {
							display: "block",
							color: "#fff",
							textDecoration: "none",
							fontSize: "auto",
							padding: "5px",
							borderRadius: "3px",
							transition: "all 0.3s ease",
							width: "50px",
							cursor: "pointer",
						});

						flairDropdown.appendChild(flairAnchor);
					});
				} catch (error) {
					flairAnchor.style.display = "none";
					flairDropdown.innerHTML = "<p>Error loading flairs.</p>";
					console.error("Flair Fetch Error:", error);
				}
			},
		});
	}

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

	if (isSubredditTopPage || isUserProfilePage) {
		const topDropdown = document.createElement("div");
		topDropdown.style.display = "none";
		topDropdown.style.position = "absolute";
		topDropdown.style.top = "0";
		topDropdown.style.left = "100%";
		topDropdown.style.backgroundColor = "rgba(48, 51, 50, .38)";
		topDropdown.style.backdropFilter = "blur(10px)";
		topDropdown.style.borderRadius = "12px";
		topDropdown.style.padding = "10px";
		topDropdown.style.boxShadow = "0 0 1px rgba(255, 255, 255, 0.3)";
		topDropdown.style.zIndex = "9999";
		topDropdown.style.color = "#fff";
		topDropdown.style.maxWidth = "15vw";

		const topOption = sortingOptions.find(
			(option) => option.text === "Top"
		);
		if (topOption) {
			const topElement = document.querySelector(`[data-option="Top"]`);
			if (topElement) {
				const topAnchor = topElement;
				topAnchor.href = `${baseUrl}${topOption.sort}`;
				topAnchor.textContent = topOption.text;
				Object.assign(topAnchor.style, {
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

				topAnchor.addEventListener("click", (e) => {
					e.preventDefault();
					topDropdown.style.display =
						topDropdown.style.display === "none" ? "block" : "none";
				});

				// Close the dropdown if clicking outside
				document.addEventListener("click", (e) => {
					const isClickInside =
						topAnchor.contains(e.target) ||
						topDropdown.contains(e.target);
					if (!isClickInside) {
						topDropdown.style.display = "none";
					}
				});
				panel.appendChild(topAnchor);
				panel.appendChild(topDropdown);

				const topSubOptions =
					isSubredditTopPage || isUserProfilePage
						? [
								{
									text: "Top - H",
									sort: "top/?sort=top&t=hour",
								},
								{
									text: "Top - D",
									sort: "top/?sort=top&t=day",
								},

								{
									text: "Top - W",
									sort: "top/?sort=top&t=week",
								},

								{
									text: "Top - M",
									sort: "top/?sort=top&t=month",
								},

								{
									text: "Top - Y",
									sort: "top/?sort=top&t=year",
								},

								{
									text: "Top - A",
									sort: "top/?sort=top&t=all",
								},
						  ]
						: [{}].filter(
								(option) => Object.keys(option).length > 0
						  );

				topSubOptions.forEach((option) => {
					const subAnchor = document.createElement("a");
					subAnchor.href = `${baseUrl}${option.sort}`;
					subAnchor.textContent = option.text;
					Object.assign(subAnchor.style, {
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

					topDropdown.appendChild(subAnchor);
				});
			}
		}
	}
	//SECTION Utils
	async function checkSubredditExists(subreddit) {
		const url = `https://old.reddit.com/r/${subreddit}/about.json`;
		const response = await fetch(url, {
			method: "HEAD",
		});
		return response.status === 200;
	}
})();
