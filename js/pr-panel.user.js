// ==UserScript==
// @name        Floating Sorting Panel
// @namespace   Violentmonkey Scripts
// @match       https://old.reddit.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @version     3.2.0
// @author      FallenStar
// @downloadURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/pr-panel.user.js
// @updateURL   https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/dev/js/pr-panel.user.js
// @description Adds sorting options as a floating panel on Reddit, drag-and-drop functionality, list all searchable flairs & more
// ==/UserScript==

(function () {
	"use strict";

	//SECTION CONFIG
	const NAVBAR_HEIGH = 28;
	const DEFAULT_POS = { left: "1%", top: "50%" };
	const BG_COLOR = "#0000008c";
	const PANEL_MAX_WIDTH = "15vw";

	//SECTION GLOBALS
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
	const DROPDOWN_STYLE = {
		position: "absolute",
		backgroundColor: "#0000008c",
		padding: "10px",
		boxShadow: "0 0 1px rgba(255, 255, 255, 0.3)",
		zIndex: "9999",
		color: "#fff",
		maxWidth: "15vw",
		left: "100%",
		top: "0",
		display: "none",
	};
	const ANCHOR_STYLE = {
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
	};
	//!SECTION
	//!SECTION

	//SECTION UTILS

	function setStyle(el, style) {
		Object.assign(el.style, style);
	}

	//Restore panel position from previous session
	const getSavedPos = () => ({
		left: GM_getValue("panelLeft", DEFAULT_POS.left),
		top: GM_getValue("panelTop", DEFAULT_POS.top),
	});

	//Save panel position
	const savePanelPos = (panel) => {
		GM_setValue("panelLeft", parseInt(panel.style.left, 10));
		GM_setValue("panelTop", parseInt(panel.style.top, 10));
	};

	// reset position userscript menu entry
	GM_registerMenuCommand("Reset Panel Position", () => {
		panel.style.left = DEFAULT_POS.left;
		panel.style.top = DEFAULT_POS.top;
		GM_setValue("panelLeft", DEFAULT_POS.left);
		GM_setValue("panelTop", DEFAULT_POS.top);
		alert("Panel position reset.");
	});
	//!SECTION
	// SECTION main panel creation
	function createPanel() {
		const panel = document.createElement("div");
		panel.id = "floating-nav-panel";
		setStyle(panel, {
			position: "fixed",
			backgroundColor: BG_COLOR,
			padding: "10px",
			boxShadow: "0 0 1px rgba(255, 255, 255, 0.3)",
			zIndex: "9999",
			color: "#fff",
			maxWidth: PANEL_MAX_WIDTH,
			cursor: "move",
		});

		const { left, top } = getSavedPos();
		panel.style.left = typeof left === "number" ? `${left}px` : left;
		panel.style.top = typeof top === "number" ? `${top}px` : top;
		document.body.appendChild(panel);
		return panel;
	}
	//!SECTION

	// SECTION drag
	function enableDrag(panel) {
		let isDragging = false,
			offset = { x: 0, y: 0 };
		panel.addEventListener("mousedown", (e) => {
			isDragging = true;
			offset.x = e.clientX - panel.getBoundingClientRect().left;
			offset.y = e.clientY - panel.getBoundingClientRect().top;
		});
		document.addEventListener("mousemove", (e) => {
			if (!isDragging) return;
			let newX = Math.max(
				0,
				Math.min(
					e.clientX - offset.x,
					window.innerWidth - panel.offsetWidth
				)
			);
			let newY = Math.max(
				0,
				Math.min(
					e.clientY - offset.y,
					window.innerHeight - panel.offsetHeight
				)
			);
			panel.style.left = `${newX}px`;
			panel.style.top = `${newY}px`;
		});
		document.addEventListener("mouseup", () => {
			if (isDragging) {
				isDragging = false;
				savePanelPos(panel);
			}
		});
	} //!SECTION

	//SECTION Search bar

	function createSearchBar(panel) {
		const inputContainer = document.createElement("div");
		inputContainer.style.position = "relative";
		panel.appendChild(inputContainer);
		const searchInput = document.createElement("input");
		searchInput.classList.add("js-search");
		searchInput.placeholder = "Go to...";
		setStyle(searchInput, {
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
		//SECTION Search bar events
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
		//!SECTION
	}
	//!SECTION

	//SECTION TOP MENU
	function createTopMenu(panel) {
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

		sortingOptions.forEach((option) => {
			const anchor = document.createElement("a");
			const sortUrl =
				isCommentPage || isUserProfilePage
					? `${baseUrl}?sort=${option.sort}`
					: `${baseUrl}${option.sort}`;
			anchor.href = sortUrl;
			anchor.textContent = option.text;
			anchor.setAttribute("data-option", option.text);
			setStyle(anchor, ANCHOR_STYLE);

			anchor.addEventListener("mouseover", () => {
				anchor.style.transform = "translateX(10px)";
			});

			anchor.addEventListener("mouseout", () => {
				anchor.style.backgroundColor = "transparent";
				anchor.style.transform = "translateX(0)";
			});

			panel.appendChild(anchor);
		});

		if (isSubredditTopPage || isUserProfilePage) {
			const topDropdown = document.createElement("div");
			setStyle(topDropdown, DROPDOWN_STYLE);

			const topOption = sortingOptions.find(
				(option) => option.text === "Top"
			);
			if (topOption) {
				const topElement =
					document.querySelector(`[data-option="Top"]`);
				if (topElement) {
					const topAnchor = topElement;
					topAnchor.href = `${baseUrl}${topOption.sort}`;
					topAnchor.textContent = topOption.text;
					if (isSubredditTopPage) {
						topAnchor.textContent = "Top ...";
					}
					setStyle(topAnchor, ANCHOR_STYLE);

					topAnchor.addEventListener("click", (e) => {
						e.preventDefault();
						topDropdown.style.display =
							topDropdown.style.display === "none"
								? "block"
								: "none";
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
						setStyle(subAnchor, ANCHOR_STYLE);
						topDropdown.appendChild(subAnchor);
					});
				}
			}
		}
	}

	//SECTION Flair Menu
	function createFlairMenu(panel) {
		const subreddit = window.location.pathname.split("/")[2];
		if (subreddit) {
			const flairDropdown = document.createElement("div");
			setStyle(flairDropdown, DROPDOWN_STYLE);

			const flairAnchor = document.createElement("a");
			flairAnchor.href = "#";
			flairAnchor.textContent = "Flairs ...";
			setStyle(flairAnchor, ANCHOR_STYLE);

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
						console.log(typeof flairs);
						console.log("flairs response", response);
						flairs.forEach((flair) => {
							const flairAnchor = document.createElement("a");
							const encodedFlair = encodeURIComponent(
								flair.text.replace(/\s+/g, "+")
							);
							flairAnchor.href = `https://old.reddit.com/r/${subreddit}/search?q=flair%3A${encodedFlair}`;
							//flairAnchor.target = "_blank"; // to open in new tab, maybe an option
							flairAnchor.textContent = flair.text;
							setStyle(flairAnchor, ANCHOR_STYLE);
							flairDropdown.appendChild(flairAnchor);
						});
					} catch (error) {
						flairAnchor.style.display = "none";
						flairDropdown.innerHTML =
							"<p>Error loading flairs.</p>";
						console.error("Flair Fetch Error:", error);
					}
				},
			});
		}
	}
	//!SECTION
	//!SECTION

	//SECTION Utils
	async function checkSubredditExists(subreddit) {
		const url = `https://old.reddit.com/r/${subreddit}/about.json`;
		const response = await fetch(url, {
			method: "HEAD",
		});
		return response.status === 200;
	}

	//SECTION INIT
	const panel = createPanel();
	createSearchBar(panel);
	createTopMenu(panel);
	createFlairMenu(panel);
	enableDrag(panel);
	//!SECTION
})();
