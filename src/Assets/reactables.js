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
         * Uploaded files.
         * @type {Object}
         */
        files;

        /**
         *
         * @param {Element} el Component element.
         */
        constructor(el) {
            // Parse component
            this.el = el;
            this.id = this.el.getAttribute('r-id');
            this.checksum = this.el.getAttribute('r-checksum');
            this.data = JSON.parse(this.el.getAttribute('r-data'));
            this.baseUrl = this.el.getAttribute('r-base-url');
            this.files = {};

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
            this.el.removeAttribute('r-data');
            this.el.removeAttribute('r-id');
            this.el.removeAttribute('r-checksum');
            this.el.removeAttribute('r-base-url');
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
                let debounce = model.getAttribute('r-debounce');
                let debounceTimeout = null;
                let value = this.data[name];
                if(value !== undefined) model.value = value;

                // Set binding event
                if(listen) model.addEventListener('input', () => {
                    this.data[name] = model.value;
                    if(!lazy) {
                        if(debounce) {
                            if(debounceTimeout) clearTimeout(debounceTimeout);
                            debounceTimeout = setTimeout(() => {
                                this.refresh();
                            }, debounce);
                        } else {
                            this.refresh();
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
                if(listen) model.addEventListener('input', () => {
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
                                this.refresh();
                            }, debounce);
                        } else {
                            this.refresh();
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
                if(listen) model.addEventListener('input', () => {
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
                                this.refresh();
                            }, debounce);
                        } else {
                            this.refresh();
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
                if(listen) model.addEventListener('input', () => {
                    this.files[name] = model.files;
                    if(!lazy) {
                        if(debounce) {
                            if(debounceTimeout) clearTimeout(debounceTimeout);
                            debounceTimeout = setTimeout(() => {
                                this.refresh();
                            }, debounce);
                        } else {
                            this.refresh();
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
                if(listen) el.addEventListener('click', event => {
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
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
                if(listen) el.addEventListener('submit', event => {
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
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
                if(listen) el.addEventListener('focus', event => {
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
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
                if(listen) el.addEventListener('blur', event => {
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
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
                if(listen) el.addEventListener('mouseover', event => {
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
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
                if(listen) el.addEventListener('mouseleave', event => {
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
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
                if(listen) el.addEventListener('keydown', event => {
                    if(event.keyCode !== 13) return;
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
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
                if(listen) el.addEventListener('keydown', event => {
                    if(event.keyCode !== 9) return;
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
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
                if(listen) {
                    if(repeatInterval) clearInterval(repeatInterval);
                    repeatInterval = setInterval(() => {
                        this.refresh('method', value);
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
                        this.refresh('method', value);
                    }, timeout);
                } else {
                    this.refresh('method', value);
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
            let url = document.location.pathname;
            if(query && query.length) url += '?' + query;
            if(document.location.hash) url += document.location.hash;
            if(url != document.location.href) window.history.pushState({}, '', url);
        }

        /**
         * Refreshes the component.
         * @param {string} type Type of the AJAX call.
         * @param {?string} extra Extra data to pass with the request.
         */
        refresh(type = 'model', extra = null) {
            // Toggle loading elements
            this.toggleLoads(false);

            // Wrap request data
            let data = new FormData();
            data.append('id', this.id);
            data.append('checksum', this.checksum);
            data.append('type', type);
            data.append('data', JSON.stringify(this.data));
            data.append('extra', extra);

            // Append uploaded files, if any
            for(let key in this.files) {
                Array.from(this.files[key]).forEach(file => {
                    data.append(key + '[]', file);
                });
            }

            // Create request
            let xhr = new XMLHttpRequest();
            let component = this;
            xhr.responseType = 'text';
            xhr.open('POST', this.baseUrl + 'reactables/component', true);

            // Upload progress event
            xhr.upload.onprogress = function(e) {
                let percent = Math.round((e.loaded / e.total) * 100);
                let event = new CustomEvent('reactables-upload-progress', {detail: percent});
                component.el.dispatchEvent(event);
            }

            // Upload success event
            xhr.upload.onload = function() {
                let event = new Event('reactables-upload-success');
                component.el.dispatchEvent(event);
            }

            // Upload error event
            xhr.upload.onerror = function() {
                let event = new Event('reactables-upload-failed');
                component.el.dispatchEvent(event);
            }

            // Load event
            xhr.onload = function() {
                if(xhr.status == 200) {
                    // Parse response
                    let response = JSON.parse(xhr.responseText);

                    // Redirect
                    if(response.redirect) return document.location = response.redirect;

                    // Morphs the HTML
                    morphdom(component.el, response.html);

                    // Parses the new data
                    component.data = JSON.parse(response.data);
                    component.files = {};

                    // Remove attributes
                    component.removeAttrs();

                    // Bind stuff
                    component.bind();

                    // Parse query string
                    component.parseQuery(response.query);

                    // Toggle loading elements
                    component.toggleLoads();

                    // Remove inits
                    component.removeInits();

                    // Dispatch update event
                    let event = new Event('reactables-update-success');
                    component.el.dispatchEvent(event);
                } else if(xhr.status == 403) {
                    // Page expired handler
                    if(document.reactables.expiredHandler) {
                        document.reactables['expiredHandler']();
                    } else {
                        document.reactables.showExpired();
                    }
                } else {
                    // Error
                    xhr.onerror();
                }
            }

            // Error event
            xhr.onerror = function() {
                if(document.reactables.errorHandler) {
                    document.reactables['errorHandler'](xhr.responseText, xhr.status);
                } else {
                    document.reactables.showError(xhr.responseText);
                }
            }

            // Perform request
            xhr.send(data);
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
         * Error handler.
         * @type {?Function}
         */
        errorHandler = null;

        /**
         * Page expired handler.
         * @type {?Function}
         */
        expiredHandler = null;

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
         * Finds a component.
         * @param {string} id Component id to search.
         */
        find(id) {
            return this.components.find(c => c.id == id);
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
        onExpired(callback) {
            this.expiredHandler = callback;
        }

        /**
         * Shows the default error modal.
         * @param {string} error Error HTML.
         */
        showError(error) {
            let errorContainer = document.createElement('div');
            errorContainer.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:999999;background:rgba(0,0,0,.7);overflow:auto;';
            errorContainer.innerHTML = error;
            document.body.appendChild(errorContainer);
        }

        /**
         * Shows the default Page Expired message.
         */
        showExpired() {
            if(confirm('This page has expired.\nWould you like to refresh the page?')) {
                document.location.reload();
            }
        }
    }

    // Checks for duplicated assets
    if(document.reactables) {
        console.error('[Reactables] You don\'t neet to included the assets more than once!');
        return;
    }

    // Init Reactables
    document.reactables = new Reactables();
    document.reactables.init();
});