import { readFileSync, writeFileSync } from "fs";

let html = readFileSync("inex.html", "utf-8");

// Remove PHP blocks
html = html.replace(/<\?php[\s\S]*?\?>/g, "");

// Replace PHP variables
html = html.replace(/<\?=\s*\$assets\s*\?>/g, "assets/");
html = html.replace(/<\?=\s*\$cta_url\s*\?>/g, "https://lp.rhinomedica.de/rn-calc/");
html = html.replace(/<\?=\s*\$site_url\s*\?>/g, "/");

writeFileSync("index.html", html, "utf-8");
console.log("index.html generated from inex.html");
