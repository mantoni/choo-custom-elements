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
 * This element is connected once and the content is updated on every render
 * cycle.
 */
customElements.define('my-section', class extends HTMLElement {

  connectedCallback() {
    console.log('section connected (only once)');
  }

  // Attributes starting with "on" are property assignments in nanohtml:
  set onrender(thing) {
    console.log('section render');

    const text = this.getAttribute('text');
    this.appendChild(html`<section><p>${text}</p></section>`);
  }
});


/*
 * This element is connected once and includes static content.
 */
customElements.define('my-button', class extends HTMLElement {

  isSameNode(node) {
    return node.nodeName === this.nodeName;
  }

  // We can use this setter to pass state and emit \o/
  set oninit([state, emit]) {
    this.emit = emit;
    // Child nodes are not available yet.
  }

  connectedCallback() {
    console.log('button connected (only once)');

    // Move the child nodes into a fragment:
    const fragment = document.createDocumentFragment();
    Array.prototype.forEach.call(this.childNodes,
      (child) => fragment.appendChild(child));

    this.appendChild(html`
      <button onclick=${() => this.emit('increment')}>
        ${fragment}
      </button>
    `);
  }
});

class ElementWithContent extends HTMLElement {
  appendChild(node) {
    if (!this.content) {
      HTMLElement.prototype.appendChild.call(this,
        this.renderTemplate());
      this.content = this.querySelector('.content');
    }
    this.content.appendChild(node);
  }

  removeChild(node) {
    this.content.removeChild(node);
  }
}

/*
 * This element is dom-diffed on every render cycle and includes content that
 * can change.
 */
customElements.define('my-state', class extends ElementWithContent {

  connectedCallback() {
    console.log('state connected (only once)');
  }

  renderTemplate() {
    return html`<pre class="content"></pre>`;
  }
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
      <my-state>
${JSON.stringify(state, null, '  ')}
      </my-state>
      <my-button oninit=${[state, emit]}>Click me!</my-button>
    </body>
  `;
}

const app = choo();
app.use(myModel);
app.route('/', myView);
app.mount('body');
