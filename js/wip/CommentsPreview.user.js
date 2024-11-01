// ==UserScript==
// @name         Reddit Comment Hover Interactive Preview
// @namespace    Violentmonkey Scripts
// @version      1.7
// @description  Displays an interactive floating preview of the comment area when hovering over Reddit comment links
// @match        https://old.reddit.com/*
// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function () {
	"use strict";

	const loggingEnabled = true;

	// Helper functions for logging
	function log(...args) {
		if (loggingEnabled) {
			console.log(...args);
		}
	}
	function logError(...args) {
		if (loggingEnabled) {
			console.error(...args);
		}
	}

	// CSS for the floating preview box
	const previewStyle = `
        #reddit-preview-box {
            position: absolute;
            display: none;
            width: 500px;
            max-height: 300px;
            overflow-y: scroll; /* Enable scrolling but hide scrollbar */
            padding: 10px;
            border-radius:12px;
            border: 1px solid #ccc;
            background-color: rgba(0, 0, 0, 0.33) !important; /* Dark semi-transparent background */
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 10000;
        }

        /* Hide scrollbar across all major browsers */
        #reddit-preview-box::-webkit-scrollbar {
            display: none; /* Chrome, Safari */
        }
        #reddit-preview-box {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
    `;

	// Slap the css on this bad boy
	const styleElement = document.createElement("style");
	styleElement.textContent = previewStyle;
	document.head.appendChild(styleElement);

	// floating preview element
	const previewBox = document.createElement("div");
	previewBox.id = "reddit-preview-box";
	document.body.appendChild(previewBox);

	// fetch & display comments
	function fetchCommentPreview(url) {
		log("Fetching comment area for URL:", url);
		GM_xmlhttpRequest({
			method: "GET",
			url: url,
			onload: function (response) {
				if (response.status === 200) {
					const html = response.responseText;
					const tempDiv = document.createElement("div");
					tempDiv.innerHTML = html;

					// extract the commentarea div
					const commentArea = tempDiv.querySelector(".commentarea");
					if (commentArea) {
						log("Comment area found, displaying in preview box");

						// hide the comment text area
						$(commentArea).find(".usertext-edit").hide();

						$("#reddit-preview-box")
							.html(commentArea.outerHTML)
							.show();
					} else {
						$("#reddit-preview-box")
							.html("<p>Comment area not found.</p>")
							.show();
					}
				} else {
					logError(
						"Failed to fetch comment area. Status:",
						response.status
					);
					$("#reddit-preview-box")
						.html("<p>Error loading preview.</p>")
						.show();
				}
			},
			onerror: function (error) {
				logError("Request error:", error);
				$("#reddit-preview-box")
					.html("<p>Error loading preview.</p>")
					.show();
			},
		});
	}

	$(document).on(
		"mouseover",
		'a[href*="old.reddit.com/r/"][href*="/comments/"]',
		function (event) {
			if (!$(event.target).closest("#reddit-preview-box").length) {
				const url = $(this).attr("href");
				log("Mouseover on Reddit link detected outside preview:", url);
				fetchCommentPreview(url);

				$("#reddit-preview-box").css({
					top: event.pageY + 15 + "px",
					left: event.pageX + 15 + "px",
				});

				$(document).off("mousemove.preview");
			}
		}
	);

	$(document).on(
		"mouseout",
		'a[href*="old.reddit.com/r/"][href*="/comments/"]',
		function () {
			log("Mouseout: Keeping preview box open for interaction");
		}
	);

	$(document).on("click", function (event) {
		if (!$(event.target).closest("#reddit-preview-box").length) {
			$("#reddit-preview-box").hide().empty();
			log("Click outside: Hiding preview box");
		}
	});
})();
