document.addEventListener('DOMContentLoaded', () => {

    /**
     * Reactables component instance.
     */
    class ReactablesComponent {

        /**
         * Component element.
         * @type {Element}
         */
        el;

        /**
         * Component id.
         * @type {string}
         */
        id;

        /**
         * Component name.
         * @type {string}
         */
        name;

        /**
         * Checksum hash.
         * @type {string}
         */
        checksum;

        /**
         * Component data.
         * @type {Object}
         */
        data;

        /**
         * Application base URL.
         * @type {string}
         */
        baseUrl;

        /**
         * Component original route.
         * @type {string}
         */
        route;

        /**
         * Uploaded files.
         * @type {Object}
         */
        files = {};

        /**
         * New elements.
         * @type {Element[]}
         */
        newEls = [];

        /**
         *
         * @param {Element} el Component element.
         */
        constructor(el) {
            // Parse component
            this.el = el;
            let data = JSON.parse(this.el.getAttribute('r-data'));
            this.id = this.el.getAttribute('r-id');
            this.name = data.name;
            this.data = JSON.parse(data.data);
            this.checksum = data.checksum;
            this.baseUrl = data.base_url;
            this.route = data.route;

            // Remove attributes
            this.removeAttrs();

            // Bind stuff
            this.bind(true);

            // Toggle loading elements
            this.toggleLoads();

            // Run inits
            this.runInits();
        }

        /**
         * Runs a query selector excluding nested components elements.
         * @param {string} query Query selector.
         * @returns {Element[]} Returns an array with the filtered elements.
         */
        find(query) {
            return Array.from(this.el.querySelectorAll(query)).filter(el => !el.closest('[r-id]'));
        }

        /**
         * Toggles the loading/ready elements.
         * @param {boolean} ready Ready state.
         */
        toggleLoads(ready = true) {
            if(ready) {
                this.find('[r-loading]').forEach(el => {
                    el.style.display = 'none';
                });

                this.find('[r-ready]').forEach(el => {
                    let attr = el.getAttribute('r-ready');
                    el.style.display = attr.length ? attr : 'inline-block';
                });

                this.find('[r-loading-class]').forEach(el => {
                    el.classList.remove(el.getAttribute('r-loading-class'));
                });

                this.find('[r-ready-class]').forEach(el => {
                    el.classList.add(el.getAttribute('r-ready-class'));
                });

                this.find('[r-loading-attr]').forEach(el => {
                    el.removeAttribute(el.getAttribute('r-loading-attr'));
                });

                this.find('[r-ready-attr]').forEach(el => {
                    el.setAttribute(el.getAttribute('r-loading-attr'), 'true');
                });
            } else {
                this.find('[r-loading]').forEach(el => {
                    let attr = el.getAttribute('r-loading');
                    el.style.display = attr.length ? attr : 'inline-block';
                });

                this.find('[r-ready]').forEach(el => {
                    el.style.display = 'none';
                });

                this.find('[r-loading-class]').forEach(el => {
                    el.classList.add(el.getAttribute('r-loading-class'));
                });

                this.find('[r-ready-class]').forEach(el => {
                    el.classList.remove(el.getAttribute('r-ready-class'));
                });

                this.find('[r-loading-attr]').forEach(el => {
                    el.setAttribute(el.getAttribute('r-loading-attr'), 'true');
                });

                this.find('[r-ready-attr]').forEach(el => {
                    el.removeAttribute(el.getAttribute('r-loading-attr'));
                });
            }
        }

        /**
         * Removes the attributes from the component.
         */
        removeAttrs() {
            this.el.removeAttribute('r-id');
            this.el.removeAttribute('r-data');
        }

        /**
         * Binds component hooks.
         * @param {boolean} listen Create event listeners.
         */
        bind(listen = false) {
            this.bindModels(listen);
            this.bindEvents(listen);
            this.bindRepeats(listen);
        }

        /**
         * Binds input models.
         * @param {boolean} listen Create event listeners.
         */
        bindModels(listen = false) {
            // Inputs
            this.find('input[type=text][r-model], input[type=date][r-model], input[type=datetime-local][r-model], input[type=email][r-model], input[type=number][r-model], input[type=month][r-model], input[type=password][r-model], input[type=range][r-model], input[type=search][r-model], input[type=tel][r-model], input[type=time][r-model], input[type=url][r-model], input[type=color][r-model], input[type=week][r-model], textarea[r-model]').forEach(model => {
                // Set initial value
                let name = model.getAttribute('r-model');
                let lazy = model.hasAttribute('r-lazy');
                let debounce = model.getAttribute('r-debounce') || 500;
                let debounceTimeout = null;
                let value = this.data[name];
                if(value !== undefined) model.value = value;

                // Set binding event
                if(listen || this.newEls.includes(model)) model.addEventListener('input', () => {
                    this.data[name] = model.value;
                    if(!lazy) {
                        if(debounce) {
                            if(debounceTimeout) clearTimeout(debounceTimeout);
                            debounceTimeout = setTimeout(() => {
                                window.reactables.refresh(this, model);
                            }, debounce);
                        } else {
                            window.reactables.refresh(this, model);
                        }
                    }
                });

                // Remove attributes
                model.removeAttribute('r-model');
                model.removeAttribute('r-lazy');
                model.removeAttribute('r-debounce');
            });

            // Checkboxes and radios
            this.find('input[type=checkbox][r-model], input[type=radio][r-model]').forEach(model => {
                // Set initial value
                let name = model.getAttribute('r-model');
                let lazy = model.hasAttribute('r-lazy');
                let debounce = model.getAttribute('r-debounce');
                let debounceTimeout = null;
                let rawName = name.replace('[]', '');
                let custom = model.getAttribute('value');
                let value = this.data[rawName];

                // Array
                if(name.endsWith('[]')) {
                    if(Array.isArray(value) && custom) {
                        if(value.some(v => v == custom)) model.checked = true;
                    }
                } else {
                    if(value !== undefined) {
                        // Custom value
                        if(custom) {
                            if(value == custom) model.checked = true;
                        } else {
                            model.checked = value;
                        }
                    }
                }

                // Set binding event
                if(listen || this.newEls.includes(model)) model.addEventListener('input', () => {
                    // Array
                    if(name.endsWith('[]')) {
                        if(!Array.isArray(this.data[rawName])) this.data[rawName] = [];
                        if(custom) {
                            if(model.checked) {
                                this.data[rawName].push(custom);
                            } else {
                                let idx = this.data[rawName].findIndex(v => v == custom);
                                if(idx !== -1) this.data[rawName].splice(idx, 1);
                            }
                        }
                    } else {
                        // Custom value
                        if(custom) {
                            this.data[name] = model.checked ? custom : false;
                        } else {
                            this.data[name] = model.checked;
                        }
                    }

                    if(!lazy) {
                        if(debounce) {
                            if(debounceTimeout) clearTimeout(debounceTimeout);
                            debounceTimeout = setTimeout(() => {
                                window.reactables.refresh(this, model);
                            }, debounce);
                        } else {
                            window.reactables.refresh(this, model);
                        }
                    }
                });

                // Remove attributes
                model.removeAttribute('r-model');
                model.removeAttribute('r-lazy');
                model.removeAttribute('r-debounce');
            });

            // Selects
            this.find('select[r-model]').forEach(model => {
                // Set initial value
                let name = model.getAttribute('r-model');
                let lazy = model.hasAttribute('r-lazy');
                let debounce = model.getAttribute('r-debounce');
                let debounceTimeout = null;
                let rawName = name.replace('[]', '');
                let value = this.data[rawName];

                // Array
                if(name.endsWith('[]')) {
                    if(Array.isArray(value)) {
                        Array.from(model.options).forEach(option => {
                            if(value.some(v => v == option.value)) option.selected = true;
                        });
                    }
                } else {
                    if(value !== undefined) model.value = value;
                }

                // Set binding event
                if(listen || this.newEls.includes(model)) model.addEventListener('input', () => {
                    // Array
                    if(name.endsWith('[]')) {
                        this.data[rawName] = [];
                        Array.from(model.selectedOptions).forEach(option => {
                            this.data[rawName].push(option.value);
                        });
                    } else {
                        this.data[rawName] = model.value;
                    }

                    if(!lazy) {
                        if(debounce) {
                            if(debounceTimeout) clearTimeout(debounceTimeout);
                            debounceTimeout = setTimeout(() => {
                                window.reactables.refresh(this, model);
                            }, debounce);
                        } else {
                            window.reactables.refresh(this, model);
                        }
                    }
                });
            });

            // File inputs
            this.find('input[type=file][r-model]').forEach(model => {
                let name = model.getAttribute('r-model');
                let lazy = model.hasAttribute('r-lazy');
                let debounce = model.getAttribute('r-debounce');
                let debounceTimeout = null;

                // Set binding event
                if(listen || this.newEls.includes(model)) model.addEventListener('input', () => {
                    this.files[name] = model.files;
                    if(!lazy) {
                        if(debounce) {
                            if(debounceTimeout) clearTimeout(debounceTimeout);
                            debounceTimeout = setTimeout(() => {
                                window.reactables.refresh(this, model);
                            }, debounce);
                        } else {
                            window.reactables.refresh(this, model);
                        }
                    }
                });

                // Remove attributes
                model.removeAttribute('r-model');
                model.removeAttribute('r-lazy');
                model.removeAttribute('r-debounce');
            });
        }

        /**
         * Binds actions to events.
         * @param {boolean} listen Create event listeners.
         */
        bindEvents(listen = false) {
            // Clicks
            this.find('[r-click]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-click');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen || this.newEls.includes(el)) el.addEventListener('click', event => {
                    if(prevent) event.preventDefault();
                    window.reactables.refresh(this, el, value);
                });

                // Remove attributes
                el.removeAttribute('r-click');
                el.removeAttribute('r-prevent');
            });

            // Form submit
            this.find('[r-submit]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-submit');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen || this.newEls.includes(el)) el.addEventListener('submit', event => {
                    if(prevent) event.preventDefault();
                    window.reactables.refresh(this, el, value);
                });

                // Remove attributes
                el.removeAttribute('r-submit');
                el.removeAttribute('r-prevent');
            });

            // Focus
            this.find('[r-focus]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-focus');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen || this.newEls.includes(el)) el.addEventListener('focus', event => {
                    if(prevent) event.preventDefault();
                    window.reactables.refresh(this, el, value);
                });

                // Remove attributes
                el.removeAttribute('r-focus');
                el.removeAttribute('r-prevent');
            });

            // Blur
            this.find('[r-blur]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-blur');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen || this.newEls.includes(el)) el.addEventListener('blur', event => {
                    if(prevent) event.preventDefault();
                    window.reactables.refresh(this, el, value);
                });

                // Remove attributes
                el.removeAttribute('r-blur');
                el.removeAttribute('r-prevent');
            });

            // Mouse hover
            this.find('[r-hover]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-hover');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen || this.newEls.includes(el)) el.addEventListener('mouseover', event => {
                    if(prevent) event.preventDefault();
                    window.reactables.refresh(this, el, value);
                });

                // Remove attributes
                el.removeAttribute('r-hover');
                el.removeAttribute('r-prevent');
            });

            // Mouse leave
            this.find('[r-leave]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-leave');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen || this.newEls.includes(el)) el.addEventListener('mouseleave', event => {
                    if(prevent) event.preventDefault();
                    window.reactables.refresh(this, el, value);
                });

                // Remove attributes
                el.removeAttribute('r-leave');
                el.removeAttribute('r-prevent');
            });

            // Enter key
            this.find('[r-enter]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-enter');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen || this.newEls.includes(el)) el.addEventListener('keydown', event => {
                    if(event.key !== 'Enter') return;
                    if(prevent) event.preventDefault();
                    window.reactables.refresh(this, el, value);
                });

                // Remove attributes
                el.removeAttribute('r-enter');
                el.removeAttribute('r-prevent');
            });

            // Tab key
            this.find('[r-tab]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-tab');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen || this.newEls.includes(el)) el.addEventListener('keydown', event => {
                    if(event.key !== 'Tab') return;
                    if(prevent) event.preventDefault();
                    window.reactables.refresh(this, el, value);
                });

                // Remove attributes
                el.removeAttribute('r-tab');
                el.removeAttribute('r-prevent');
            });
        }

        /**
         * Binds the repeat calls.
         * @param {boolean} listen Create event listeners.
         */
        bindRepeats(listen = false) {
            this.find('[r-repeat][r-interval]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-repeat');
                let interval = el.getAttribute('r-interval');
                let repeatInterval = null;

                // Set interval
                if(listen || this.newEls.includes(el)) {
                    if(repeatInterval) clearInterval(repeatInterval);
                    repeatInterval = setInterval(() => {
                        window.reactables.refresh(this, el, value);
                    }, interval);
                }

                // Remove attributes
                el.removeAttribute('r-repeat');
                el.removeAttribute('r-interval');
            });
        }

        /**
         * Run init functions.
         */
        runInits() {
            this.find('[r-init]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-init');
                let timeout = el.getAttribute('r-timeout');
                let timeoutInterval = null;

                // Run method
                if(timeout) {
                    if(timeoutInterval) clearTimeout(timeoutInterval);
                    timeoutInterval = setTimeout(() => {
                        window.reactables.refresh(this, el, value);
                    }, timeout);
                } else {
                    window.reactables.refresh(this, el, value);
                }

                // Remove attributes
                el.removeAttribute('r-init');
                el.removeAttribute('r-timeout');
            });
        }

        /**
         * Remove init attributes.
         */
        removeInits() {
            this.find('[r-init]').forEach(el => {
                // Remove attributes
                el.removeAttribute('r-init');
                el.removeAttribute('r-timeout');
            });
        }

        /**
         * Parse query string.
         * @param {?string} query Query string.
         */
        parseQuery(query) {
            let url = location.pathname;
            if(query && query.length) url += '?' + query;
            if(location.hash) url += location.hash;
            if(url != location.href) history.pushState({}, '', url);
        }

        /**
         * Dispatches component events.
         * @param {Object[]} events Array of events to dispatch.
         */
        dispatchEvents(events) {
            if(!events || !events.length) return;
            events.forEach(event => {
                if(window.reactables.listeners[event.name]) {
                    window.reactables.listeners[event.name](...event.params);
                }
            });
        }
    }

    /**
     * Reactables core class.
     */
    class Reactables {

        /**
         * List of components.
         * @type {ReactablesComponent[]}
         */
        components = [];

        /**
         * Event listeners.
         * @type {Object}
         */
        listeners = {};

        /**
         * Error handler.
         * @type {?Function}
         */
        errorHandler;

        /**
         * Page expired handler.
         * @type {?Function}
         */
        expiredHandler;

        /**
         * Previous body overflow setting.
         * @var {string}
         */
        overflow;

        /**
         * Initializes the Reactables core.
         */
        init() {
            // Initialize components
            document.querySelectorAll('[r-id]').forEach(el => {
                this.components.push(new ReactablesComponent(el));
            });

            // Dispatch ready event
            let ready = new Event('reactables-ready');
            document.dispatchEvent(ready);
        }

        /**
         * Returns all components.
         * @returns {ReactablesComponent[]} Returns the component list.
         */
        all() {
            return this.components;
        }

        /**
         * Finds a component by its id.
         * @param {string} id Component id to search.
         * @returns {ReactablesComponent | undefined} Returns the component if found.
         */
        find(id) {
            return this.components.find(c => c.id == id);
        }

        /**
         * Sets a custom event listener.
         * @param {string} eventName Custom event name to listen.
         * @param {Function} callback Listener function.
         */
        on(eventName, callback) {
            this.listeners[eventName] = callback;
        }

        /**
         * Sets a custom error handler.
         * @param {Function} callback Custom error handler function. The function receives two parameters:\
         * the error message body and the HTTP status code.
         */
        onError(callback) {
            this.errorHandler = callback;
        }

        /**
         * Sets a custom Page Expired error handler.
         * @param {Function} callback Custom page expired handler function.
         */
        onPageExpired(callback) {
            this.expiredHandler = callback;
        }

        /**
         * Shows the default error modal.
         * @param {string} error Error HTML.
         */
        showError(error) {
            // Create error page
            let html = document.createElement('html');
            html.innerHTML = error;

            // Create error modal
            let modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;inset:0;padding:30px;z-index:999999;background:rgba(0,0,0,.7);';

            // Create error iframe
            let iframe = document.createElement('iframe');
            iframe.style.cssText = 'width:100%;height:100%;border-radius:5px;';

            // Append to body
            modal.appendChild(iframe);
            document.body.prepend(modal);

            // Saves the current overflow state
            this.overflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            // Sets the iframe content
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(html.outerHTML);
            iframe.contentWindow.document.close();

            // Hide modal on click outside
            modal.addEventListener('click', () => {
                modal.remove();
                document.body.style.overflow = this.overflow;
            });

            // Hide modal on Esc key pressed
            modal.setAttribute('tabindex', 0);
            modal.addEventListener('keydown', e => {
                if(e.key === 'Escape') {
                    modal.remove();
                    document.body.style.overflow = this.overflow;
                }
            });
            modal.focus();
        }

        /**
         * Shows the default Page Expired message.
         */
        showExpired() {
            if(confirm('This page has expired.\nWould you like to refresh the page?')) {
                location.reload();
            }
        }

        /**
         * Refreshes a component.
         * @param {ReactablesComponent} component Component to be refreshed.
         * @param {Element} el Element that called the refresh.
         * @param {?string} method Method call, if any.
         */
        refresh(component, el, method = null) {
            // Toggle loading elements
            component.toggleLoads(false);

            // Wrap request data
            let data = new FormData();
            data.append('id', component.id);
            data.append('name', component.name);
            data.append('data', JSON.stringify(component.data));
            data.append('checksum', component.checksum);
            data.append('route', component.route);
            if(method) data.append('method', method);

            // Append uploaded files, if any
            for(let key in component.files) {
                Array.from(component.files[key]).forEach(file => {
                    data.append(key + '[]', file);
                });
            }

            // Create request
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'text';
            xhr.withCredentials = true;
            xhr.open('POST', component.baseUrl + 'reactables/component', true);
            xhr.setRequestHeader('X-Reactables', true);

            // Upload start event
            xhr.upload.onloadstart = () => {
                let event = new Event('reactables-upload-start');
                el.dispatchEvent(event);
            }

            // Upload progress event
            xhr.upload.onprogress = e => {
                let percent = Math.round((e.loaded / e.total) * 100);
                let event = new CustomEvent('reactables-upload-progress', {detail: percent});
                el.dispatchEvent(event);
            }

            // Upload success event
            xhr.upload.onload = () => {
                let event = new Event('reactables-upload-success');
                el.dispatchEvent(event);
            }

            // Upload error event
            xhr.upload.onerror = () => {
                let event = new Event('reactables-upload-failed');
                el.dispatchEvent(event);
            }

            // Load event
            xhr.onload = () => {
                if(xhr.status == 200) {
                    // Parse response
                    let response = JSON.parse(xhr.responseText);

                    // Redirect
                    if(response.redirect) return location.href = response.redirect;

                    // Morphs the HTML
                    component.newEls = [];
                    morphdom(component.el, response.html, {

                        // Parse new elements
                        onNodeAdded: node => {
                            if(node.hasAttribute('r-id')) {
                                window.reactables.components.push(new ReactablesComponent(node));
                                node.skipAddingChildren = true;
                            } else {
                                component.newEls.push(node);
                            }
                        },

                        // Return unique element key
                        getNodeKey: node => {
                            let key = node.getAttribute('r-key');
                            return key ? key : node.id;
                        },

                        // Prevent virtual DOM problems
                        onBeforeElUpdated: (from, to) => {
                            return !from.isEqualNode(to);
                        }

                    });

                    // Parses the new data
                    component.data = JSON.parse(response.data);
                    component.files = {};

                    // Remove attributes
                    component.removeAttrs();

                    // Bind stuff
                    component.bind();

                    // Parse query string
                    component.parseQuery(response.query);

                    // Dispatch events
                    component.dispatchEvents(response.events);

                    // Toggle loading elements
                    component.toggleLoads();

                    // Remove inits
                    component.removeInits();

                    // Dispatch update event
                    let event = new Event('reactables-update-success');
                    document.dispatchEvent(event);
                } else if(xhr.status == 403) {
                    // Page expired handler
                    if(window.reactables.expiredHandler) {
                        window.reactables['expiredHandler'](xhr.responseText, xhr.status);
                    } else {
                        window.reactables.showExpired();
                    }
                } else {
                    // Error
                    xhr.onerror();
                }
            }

            // Error event
            xhr.onerror = () => {
                if(window.reactables.errorHandler) {
                    window.reactables['errorHandler'](xhr.responseText, xhr.status);
                } else {
                    window.reactables.showError(xhr.responseText);
                }
            }

            // Perform request
            xhr.send(data);
        }
    }

    // Checks for duplicated assets
    if(window.reactables) {
        console.error('[Reactables] You don\'t neet to included the assets more than once!');
        return;
    }

    // Init Reactables
    window.reactables = new Reactables();
    window.Reactables = window.reactables;
    window.reactables.init();
});