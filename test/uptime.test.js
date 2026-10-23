// Runs app.js in Node with a tiny fake browser, types `uptime` into the
// Terminal, and checks the minutes it prints. Run with: node test/uptime.test.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// A stand-in for a DOM element. Enough for app.js to build the Terminal.
class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.className = "";
    this.textContent = "";
    this.innerHTML = "";
    this.value = "";
    this.style = { setProperty() {} };
    this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
    this.children = [];
    this.listeners = {};
    this.queried = {};
  }
  focus() {}
  setPointerCapture() {}
  releasePointerCapture() {}
  hasPointerCapture() {
    return false;
  }
  addEventListener(type, fn) {
    (this.listeners[type] ??= []).push(fn);
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  querySelector(selector) {
    // The same selector always returns the same element, like a real page.
    return (this.queried[selector] ??= new FakeElement(selector));
  }
  remove() {}
}

let now = 1_000_000_000_000; // fake "current time" in milliseconds

class FakeDate extends Date {
  static now() {
    return now;
  }
}

const elements = {};
const sandbox = {
  Date: FakeDate,
  console,
  innerWidth: 1024,
  setInterval() {},
  localStorage: { getItem: () => null, setItem() {} },
  document: {
    documentElement: new FakeElement("html"),
    getElementById: (id) => (elements[id] ??= new FakeElement(id)),
    createElement: () => new FakeElement()
  }
};
elements.desk = new FakeElement("desk");
elements.dock = new FakeElement("dock");
elements.clock = new FakeElement("clock");

vm.createContext(sandbox);
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
// The Terminal opens at load time, so boot happens at `now` here.
vm.runInContext(source, sandbox, { filename: "app.js" });

// Find the Terminal's input and output, then type a command and press Enter.
const terminalBody = elements.desk.children[0].querySelector(".body");
const input = terminalBody.querySelector("#cmd");
const out = terminalBody.querySelector("#out");

const typeCommand = (command) => {
  input.value = command;
  const [onKeyDown] = input.listeners.keydown;
  onKeyDown({ key: "Enter", preventDefault() {} });
  return out.children[out.children.length - 1].textContent;
};

const failures = [];
const check = (command, expected) => {
  const actual = typeCommand(command);
  if (!actual.startsWith(expected)) {
    failures.push(`expected "${expected}" but got "${actual}"`);
  }
};

// Right after opening, uptime is 0 minutes.
check("uptime", "up 0 minutes");

// After 2 real minutes, uptime is 2 minutes.
now += 2 * 60 * 1000;
check("uptime", "up 2 minutes");

if (failures.length > 0) {
  console.error(`uptime test failed:\n${failures.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("uptime test passed");
}
