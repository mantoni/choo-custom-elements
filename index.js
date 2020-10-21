'use strict';

const html = require('choo/html');
const choo = require('choo');


/*
 * This element is static and is never refreshed once rendered.
 */
customElements.define('my-heading', class extends HTMLElement {

  isSameNode(node) {
    return node.nodeName === this.nodeName;
  }

  connectedCallback(value) {
    console.log('heading connected (only once)');
    this.appendChild(html`<h1>${document.title}</h1>`);
  }
});


/*
 * This element is re-created and dom-diffed on every render cycle.
 */
customElements.define('my-section', class extends HTMLElement {

  // Attributes starting with "on" are property assignments in nanohtml:
  set onrender(thing) {
    console.log('section render (on every render)');

    const text = this.getAttribute('text');
    this.appendChild(html`<section><p>${text}</p></section>`);
  }
});


/*
 * This element is created once and includes static content.
 */
customElements.define('my-button', class extends HTMLElement {

  isSameNode(node) {
    return node.nodeName === this.nodeName;
  }

  // We can use this setter to pass state and emit \o/
  set onrender([state, emit]) {
    if (!this.emit) {
      // First call. Child nodes are not available yet.
      this.emit = emit;
    } else {
      // Only when refreshing.
      this.render();
    }
  }

  connectedCallback() {
    console.log('button connected (only once)');

    // Move the child nodes into a fragment:
    this.fragment = document.createDocumentFragment();
    Array.prototype.forEach.call(this.childNodes,
      (child) => this.fragment.appendChild(child));

    // Initial render:
    this.render();
  }

  render() {
    this.appendChild(html`
      <button onclick=${() => this.emit('increment')}>
        ${this.fragment}
      </button>
    `);
  }
});


/*
 * This element is re-created and dom-diffed on every render cycle and includes
 * content that can change.
 */
customElements.define('my-state', class extends HTMLElement {

  connectedCallback() {
    console.log('state connected (only once)');
  }

  appendChild(node) {
    HTMLElement.prototype.appendChild.call(this, html`
      <pre>
        ${node}
      </pre>
    `);
  }

  removeChild() {}
});


function myModel(state, emitter) {
  state.clicks = 0;
  emitter.on('increment', () => {
    state.clicks += 1;
    emitter.emit('render');
  });
}

function myView(state, emit) {
  return html`
    <body>
      <my-heading></my-heading>
      <hr>
      <my-section text="Clicks: ${state.clicks}" onrender=1></my-section>
      <my-button onrender=${[state, emit]}>Click me!</my-button>
      <my-state>
        ${JSON.stringify({ clicks: state.clicks }, null, '  ')}
      </my-state>
    </body>
  `;
}

const app = choo();
app.use(myModel);
app.route('/', myView);
app.mount('body');
