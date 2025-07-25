// ==UserScript==
// @name         Reddit Masonry Card View (with Masonry.js)
// @namespace    https://reddit.com/
// @version      1.1
// @description  Shows Reddit posts in a true Pinterest-style masonry layout using Masonry.js, with configurable columns
// @author       You
// @match        https://old.reddit.com/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @require      https://code.jquery.com/jquery-3.7.1.slim.min.js
// @require      https://unpkg.com/isotope-layout@3/dist/isotope.pkgd.min.js
// ==/UserScript==

(function () {
	"use strict";

	const STORAGE_KEY = "redditMasonryColumns";
	const defaultColumns = 3;
	const columns =
		parseInt(localStorage.getItem(STORAGE_KEY)) || defaultColumns;

	// Settings Menu
	GM_registerMenuCommand("Set number of columns", () => {
		const newVal = prompt("How many columns?", columns);
		if (!newVal) return;
		const n = parseInt(newVal);
		if (isNaN(n) || n < 1 || n > 10) {
			alert("Enter a number between 1 and 10.");
			return;
		}
		localStorage.setItem(STORAGE_KEY, n);
		location.reload();
	});

	// Inject Masonry.js
	const script = document.createElement("script");
	script.src = "https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js";
	script.onload = runMasonryLayout;
	document.head.appendChild(script);

	// Add styles
	GM_addStyle(`
      #siteTable {
        max-width: ${columns * 340}px;
        margin:0px !important;
        padding-left: 5% !important;
      }
  
      .thing.link {
  
        margin-bottom: 16px;
        background: #fff;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid #ccc;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        display: block;
        box-sizing: border-box;
      }
  
      .thing .thumbnail {
        display: block;
        width: 100% !important;
        margin: 8px 0;
      }
  
      .thing .thumbnail img {
        width: 100% !important;
        height: auto !important;
        object-fit: cover;
        border-radius: 8px;
        display: block;
      }
  
      .thing .entry .top-matter .title {
        font-size: 18px !important;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .rank,
      .thumbnail.self,
      .thing .entry .flat-list,
      .thing .midcol,
      .image{
        display: none !important;
      }
  
      .reddit-card-footer {
        font-size: 14px;
        padding-top: 8px;
        margin-top: 8px;
        border-top: 1px solid black;
      }
  
      .reddit-card-footer span {
        margin-right: 16px;
      }
  
      .clearleft {
        display: none !important;
      }
    `);
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
	function runMasonryLayout() {
		let masonryInstance = null;

		// Setup observer
		const observer = new MutationObserver(() => {
			fixPostsDisplay();
			const container = document.querySelector(
				"#siteTable:not(:has(.sitetable))"
			);
			if (!container) return;

			// Move progressIndicator out
			const indicator = document.querySelector("#progressIndicator");
			if (indicator && indicator.parentElement === container) {
				container.parentElement.insertBefore(
					indicator,
					container.nextSibling
				);
			}

			// Add footer if missing
			const newItems = [];
			document
				.querySelectorAll(".thing.link:not([data-processed])")
				.forEach((post) => {
					post.dataset.processed = "true";
					const entry = post.querySelector(".entry");
					const commentsLink = post.querySelector("a.comments");
					const score = post.querySelector(".score.unvoted");
					const thumbnail = post.querySelector(".thumbnail");

					const footer = document.createElement("div");
					footer.className = "reddit-card-footer";
					const scoreText = score ? score.textContent.trim() : "0";
					const commentText = commentsLink
						? commentsLink.textContent.trim()
						: "0 comments";

					footer.innerHTML = `<span>⬆️ ${scoreText}</span><span>💬 ${commentText}</span>`;
					if (entry && thumbnail && thumbnail.parentNode === post) {
						post.insertBefore(footer, entry.nextSibling);
					}

					newItems.push(post);
				});

			// Initialize Masonry once
			if (!masonryInstance) {
				const gutter = 16;
				const maxContainerWidth = window.innerWidth * 0.55;
				const minCardWidth = 240;

				// Adjust columns if needed to prevent overflow
				let adjustedColumns = columns;
				while (adjustedColumns > 1) {
					const totalGutter = (adjustedColumns - 1) * gutter;
					const potentialCardWidth = Math.floor(
						(maxContainerWidth - totalGutter) / adjustedColumns
					);
					if (potentialCardWidth >= minCardWidth) break;
					adjustedColumns--;
				}

				const totalGutter = (adjustedColumns - 1) * gutter;
				const cardWidth = Math.floor(
					(maxContainerWidth - totalGutter) / adjustedColumns
				);
				const totalWidth = adjustedColumns * cardWidth + totalGutter;

				container.style.width = `${totalWidth}px`;
				container.style.margin = "0 auto";

				// Update card widths
				document.querySelectorAll(".thing.link").forEach((post) => {
					post.style.width = `${cardWidth}px`;
				});

				container.style.width = `${totalWidth}px`;
				container.style.margin = "0 auto";

				masonryInstance = new Masonry(container, {
					itemSelector: ".thing.link",
					columnWidth: cardWidth,
					gutter: gutter,
					fitWidth: true,
				});
			} else if (newItems.length) {
				masonryInstance.appended(newItems);
				masonryInstance.layout();
			}
		});

		observer.observe(document.querySelector("#siteTable"), {
			childList: true,
			subtree: true,
		});
	}
})();
