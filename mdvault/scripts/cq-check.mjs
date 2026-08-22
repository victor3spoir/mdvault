import { writeFileSync } from "node:fs";
import WebSocket from "ws";

const [, , url, rawWidth, out] = process.argv;
const width = Number(rawWidth ?? 1280);
const pages = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const page = pages.find(
	(p) => p.type === "page" && p.url.includes("localhost:3000"),
);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.on("open", r));

let id = 0;
const pend = new Map();
ws.on("message", (raw) => {
	const m = JSON.parse(raw.toString());
	if (m.id && pend.has(m.id)) {
		pend.get(m.id)(m.result);
		pend.delete(m.id);
	}
});
const send = (method, params = {}) =>
	new Promise((res) => {
		const mid = ++id;
		pend.set(mid, res);
		ws.send(JSON.stringify({ id: mid, method, params }));
	});

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
	width,
	height: 900,
	deviceScaleFactor: 1,
	mobile: false,
});
await send("Page.navigate", { url });
await new Promise((r) => setTimeout(r, 9000));

// Sample the header box during a scroll to catch any drift.
const probe = await send("Runtime.evaluate", {
	awaitPromise: true,
	returnByValue: true,
	expression: `(async () => {
		const h = document.querySelector("header");
		const samples = [];
		for (let y = 0; y <= 900; y += 60) {
			window.scrollTo(0, y);
			await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
			const r = h.getBoundingClientRect();
			samples.push([window.scrollY, +r.top.toFixed(2), +r.height.toFixed(2)]);
		}
		const el = h.parentElement;
		const chain = [];
		let n = h;
		while (n && n !== document.documentElement) {
			const cs = getComputedStyle(n);
			chain.push(n.tagName + "." + (n.className.toString().slice(0, 40)) + " | pos=" + cs.position + " transform=" + cs.transform + " filter=" + cs.filter + " overflow=" + cs.overflow + " contain=" + cs.contain + " willChange=" + cs.willChange);
			n = n.parentElement;
		}
		return JSON.stringify({ samples, chain, docScroll: document.scrollingElement === document.documentElement }, null, 1);
	})()`,
});
console.log(probe.result.value);
const shot = await send("Page.captureScreenshot", { format: "png" });
writeFileSync(out, Buffer.from(shot.data, "base64"));
await send("Emulation.clearDeviceMetricsOverride");
ws.close();
