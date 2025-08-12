const fs = require("fs");
const path = require("path");

const SOURCE_FILE = "js/PrettyReddit.user.js";
const OUTPUT_FILE = "js/PrettyReddit.dist.user.js";

const REQUIRED_SCRIPTS = [
	"js/pr-navbar.user.js",
	"js/pr-sidebar.user.js",
	"js/pr-panel.user.js",
];

// Regex to find @require lines with ?VERSION
const requireRegex =
	/^\/\/\s*@require\s+(https:\/\/[^\s\?]+\.user\.js)\?VERSION/gm;

const srcPath = path.join(__dirname, SOURCE_FILE);
const distPath = path.join(__dirname, OUTPUT_FILE);

const getVersionFromFile = (filePath) => {
	const fileContent = fs.readFileSync(filePath, "utf8");
	const versionMatch = fileContent.match(/@version\s+([^\s]+)/);
	if (versionMatch) {
		return versionMatch[1];
	}
	return null;
};

let content = fs.readFileSync(srcPath, "utf8");

const requires = [...content.matchAll(requireRegex)];
if (requires.length === 0) {
	console.log("No ?VERSION @require lines found.");
	process.exit(0);
}

const requiredVersions = {};

REQUIRED_SCRIPTS.forEach((scriptPath) => {
	const fullPath = path.join(__dirname, scriptPath);
	const version = getVersionFromFile(fullPath);
	if (version) {
		requiredVersions[scriptPath] = version;
		console.log(`✅ Found version for ${scriptPath}: ${version}`);
	} else {
		console.error(`⚠️ No version found in ${scriptPath}, skipping.`);
	}
});

let newContent = content;
requires.forEach((match) => {
	const url = match[1];
	const scriptName = url.split("/").pop();

	const relativePath = `js/${scriptName}`;
	const version = requiredVersions[relativePath];

	if (version) {
		const pattern = new RegExp(`(${url}\\?)VERSION\\b`, "g");
		newContent = newContent.replace(pattern, `$1v=${version}`);
		console.log(`✅ Replaced: ${url}?VERSION → ?v=${version}`);
	} else {
		console.error(
			`⚠️ No version for ${relativePath}, skipping replacement.`
		);
	}
});

fs.writeFileSync(distPath, newContent, "utf8");
console.log(`💾 Wrote updated script to ${OUTPUT_FILE}`);
