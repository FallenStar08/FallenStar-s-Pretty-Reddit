// ==UserScript==
// @name        Floating Sorting Panel
// @namespace   Violentmonkey Scripts
// @match       https://old.reddit.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @version     3.2.3
// @author      FallenStar
// @downloadURL https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/pr-panel.user.js
// @updateURL   https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/pr-panel.user.js
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
	//SECTION STYLES
	const PANEL_STYLE = {
		position: "fixed",
		backgroundColor: BG_COLOR,
		padding: "10px",
		border: "1px solid black",
		zIndex: "9999",
		color: "#fff",
		maxWidth: PANEL_MAX_WIDTH,
		cursor: "move",
	};
	const DROPDOWN_STYLE = {
		position: "absolute",
		backgroundColor: "#0000008c",
		padding: "10px",
		border: "1px solid black",
		zIndex: "9999",
		color: "#fff",
		maxWidth: PANEL_MAX_WIDTH,
		left: "100%",
		top: "-1px",
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
	const SEARCHINPUT_STYLE = {
		backgroundColor: "transparent",
		borderRadius: "0px",
		margin: "0px",
		border: "0px",
		color: "white",
		padding: "5px",
		fontSize: "12px",
		width: "50px",
		overflow: "auto",
	};
	//!SECTION
	//!SECTION
	//!SECTION

	//SECTION UTILS

	function setStyle(el, style) {
		Object.assign(el.style, style);
	}

	function moveRightOnHover(el) {
		el.addEventListener("mouseover", () => {
			el.style.transform = "translateX(10px)";
		});
		el.addEventListener("mouseout", () => {
			el.style.transform = "translateX(0px)";
		});
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
		setStyle(panel, PANEL_STYLE);

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
				NAVBAR_HEIGH,
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
		setStyle(searchInput, SEARCHINPUT_STYLE);
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

	//SECTION Top Menu
	function createTopMenu(panel) {
		// Configuration for pages
		const SORTING_CONFIGS = {
			userProfile: [
				{ text: "New", sort: "new" },
				{ text: "Top", sort: "top" },
				{ text: "Hot", sort: "hot" },
			],
			comment: [
				{ text: "Best", sort: "confidence" },
				{ text: "New", sort: "new" },
				{ text: "Old", sort: "old" },
				{ text: "Top", sort: "top" },
				{ text: "Contro", sort: "controversial" },
				{ text: "Q&A", sort: "qa" },
			],
			default: [
				{ text: "Hot", sort: "hot" },
				{ text: "New", sort: "new" },
				{ text: "Top", sort: "top" },
				{ text: "Contro", sort: "controversial" },
				{ text: "Rising", sort: "rising" },
			],
		};

		const TOP_TIME_RANGES = [
			{ text: "Top - H", sort: "top/?sort=top&t=hour" },
			{ text: "Top - D", sort: "top/?sort=top&t=day" },
			{ text: "Top - W", sort: "top/?sort=top&t=week" },
			{ text: "Top - M", sort: "top/?sort=top&t=month" },
			{ text: "Top - Y", sort: "top/?sort=top&t=year" },
			{ text: "Top - A", sort: "top/?sort=top&t=all" },
		];

		const getSortingOptions = () => {
			if (isUserProfilePage) return SORTING_CONFIGS.userProfile;
			if (isCommentPage) return SORTING_CONFIGS.comment;
			return SORTING_CONFIGS.default;
		};

		const buildSortUrl = (option) => {
			if (isCommentPage || isUserProfilePage) {
				return `${baseUrl}?sort=${option.sort}`;
			}
			return `${baseUrl}${option.sort}`;
		};

		const createSortAnchor = (option) => {
			const anchor = document.createElement("a");
			anchor.href = buildSortUrl(option);
			anchor.textContent = option.text;
			anchor.setAttribute("data-option", option.text);
			setStyle(anchor, ANCHOR_STYLE);
			moveRightOnHover(anchor);
			return anchor;
		};

		const createTopDropdown = () => {
			const dropdown = document.createElement("div");
			setStyle(dropdown, DROPDOWN_STYLE);
			dropdown.style.display = "none";

			TOP_TIME_RANGES.forEach((option) => {
				const subAnchor = document.createElement("a");
				subAnchor.href = `${baseUrl}${option.sort}`;
				subAnchor.textContent = option.text;
				setStyle(subAnchor, ANCHOR_STYLE);
				moveRightOnHover(subAnchor);
				dropdown.appendChild(subAnchor);
			});

			return dropdown;
		};

		const setupTopDropdownToggle = (topAnchor, dropdown) => {
			if (isSubredditTopPage) {
				topAnchor.textContent = "Top ...";
			}

			topAnchor.addEventListener("click", (e) => {
				e.preventDefault();
				dropdown.style.display =
					dropdown.style.display === "none" ? "block" : "none";
			});

			const closeDropdownHandler = (e) => {
				const isClickInside =
					topAnchor.contains(e.target) || dropdown.contains(e.target);
				if (!isClickInside) {
					dropdown.style.display = "none";
				}
			};

			document.removeEventListener("click", closeDropdownHandler);
			document.addEventListener("click", closeDropdownHandler);
		};

		const sortingOptions = getSortingOptions();
		const shouldShowTopDropdown = isSubredditTopPage || isUserProfilePage;
		let topAnchor = null;

		sortingOptions.forEach((option) => {
			const anchor = createSortAnchor(option);

			if (option.text === "Top" && shouldShowTopDropdown) {
				topAnchor = anchor;
			}

			panel.appendChild(anchor);
		});

		if (shouldShowTopDropdown && topAnchor) {
			const dropdown = createTopDropdown();
			setupTopDropdownToggle(topAnchor, dropdown);

			topAnchor.insertAdjacentElement("afterend", dropdown);
		}
	}
	//!SECTION

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

			moveRightOnHover(flairAnchor);

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
							moveRightOnHover(flairAnchor);
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
	//!SECTION
	//SECTION INIT
	const panel = createPanel();
	createSearchBar(panel);
	createTopMenu(panel);
	createFlairMenu(panel);
	enableDrag(panel);
	//!SECTION
})();
