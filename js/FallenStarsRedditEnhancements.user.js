// ==UserScript==
// @name        FallenStar's reddit enhancements
// @namespace   http://tampermonkey.net/
// @version     1.0.4
// @author      FallenStar
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @description Master script to include other userscripts
// @match       https://old.reddit.com/*
// @grant       none
// @require     https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/NavBarFixesModule.user.js
// @require     https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/CollapsibleSidebarModule.user.js
// @require     https://github.com/FallenStar08/FallenStar-s-Pretty-Reddit/raw/refs/heads/main/js/FloatingPanelModule.user.js

// ==/UserScript==

(function () {
	"use strict";

	window.GMStorage = {
		get: (key, defaultValue) => {
			return GM_getValue(key, defaultValue);
		},
		set: (key, value) => {
			GM_setValue(key, value);
		},
	};

	const DEFAULT_PANEL_POSITION = { left: "1%", top: "50%" };

	GM_registerMenuCommand("Reset All Settings", () => {
		GMStorage.set("panelLeft", DEFAULT_PANEL_POSITION.left);
		GMStorage.set("panelTop", DEFAULT_PANEL_POSITION.top);
		alert("All settings reset to defaults.");
	});
})();
