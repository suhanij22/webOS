const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('app.js', 'utf8');
const notesSource = source.slice(source.indexOf('const markdownToHtml ='), source.indexOf('/* ---- settings app ---- */'));
const elements = {};
const document = {
  createElement(tag) {
    const element = { tag, style: {}, value: '', textContent: '', innerHTML: '', listeners: {},
      addEventListener(name, callback) { this.listeners[name] = callback; } };
    return element;
  }
};
const disk = { read: () => '# Hello', write() {} };
const body = {
  className: '',
  set innerHTML(value) {
    this._innerHTML = value;
    elements.wc = { textContent: '' };
    elements.st = { textContent: '' };
    elements.pv = { textContent: '', addEventListener(name, callback) { this.listeners = this.listeners || {}; this.listeners[name] = callback; } };
  },
  get innerHTML() { return this._innerHTML; },
  append(...children) { this.children = children; },
  querySelector(selector) { return elements[selector.slice(1)]; }
};
const context = { document, disk };
vm.createContext(context);
vm.runInContext(`${notesSource}; globalThis.startNotes = notesApp;`, context);
context.startNotes(body);
const [textarea, preview] = body.children;
const button = elements.pv;
button.listeners.click();
assert.equal(preview.style.display, 'block');
button.listeners.click();
assert.equal(textarea.style.display, '', 'Edit should show the text box');
assert.equal(textarea.value, '# Hello', 'Edit should preserve the note');
assert.equal(preview.style.display, 'none');
