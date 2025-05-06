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
         *
         * @param {Element} el Component element.
         */
        constructor(el) {
            // Parse component
            this.el = el;
            let data = JSON.parse(this.el.getAttribute('r:data'));
            this.id = this.el.getAttribute('r:id');
            this.name = data.name;
            this.data = JSON.parse(data.data);
            this.checksum = data.checksum;
            this.baseUrl = data.base_url;
            this.route = data.route;
            this.files = {};

            // Remove attributes
            this.removeAttrs();

            // Bind stuff
            this.bind();

            // Parse navigation links
            this.parseNavigateLinks();

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
            return Array.from(this.el.querySelectorAll(query)).filter(el => el.closest('[r\\:id]') === this.el);
        }

        /**
         * Toggles the loading/ready elements.
         * @param {boolean} ready Ready state.
         */
        toggleLoads(ready = true) {
            if(ready) {
                this.find('[r\\:loading]').forEach(el => {
                    el.style.display = 'none';
                });

                this.find('[r\\:ready]').forEach(el => {
                    let attr = el.getAttribute('r:ready');
                    el.style.display = attr.length ? attr : 'inline-block';
                });

                this.find('[r\\:loading-class]').forEach(el => {
                    el.classList.remove(el.getAttribute('r:loading-class'));
                });

                this.find('[r\\:ready-class]').forEach(el => {
                    el.classList.add(el.getAttribute('r:ready-class'));
                });

                this.find('[r\\:loading-attr]').forEach(el => {
                    el.removeAttribute(el.getAttribute('r:loading-attr'));
                });

                this.find('[r\\:ready-attr]').forEach(el => {
                    el.setAttribute(el.getAttribute('r:loading-attr'), 'true');
                });
            } else {
                this.find('[r\\:loading]').forEach(el => {
                    let attr = el.getAttribute('r:loading');
                    el.style.display = attr.length ? attr : 'inline-block';
                });

                this.find('[r\\:ready]').forEach(el => {
                    el.style.display = 'none';
                });

                this.find('[r\\:loading-class]').forEach(el => {
                    el.classList.add(el.getAttribute('r:loading-class'));
                });

                this.find('[r\\:ready-class]').forEach(el => {
                    el.classList.remove(el.getAttribute('r:ready-class'));
                });

                this.find('[r\\:loading-attr]').forEach(el => {
                    el.setAttribute(el.getAttribute('r:loading-attr'), 'true');
                });

                this.find('[r\\:ready-attr]').forEach(el => {
                    el.removeAttribute(el.getAttribute('r:loading-attr'));
                });
            }
        }

        /**
         * Removes the attributes from the component.
         */
        removeAttrs() {
            this.el.removeAttribute('r:data');
        }

        /**
         * Binds component hooks.
         */
        bind() {
            this.bindModels();
            this.bindEvents();
            this.bindRepeats();
        }

        /**
         * Binds input models.
         */
        bindModels() {
            // Inputs
            this.find('input[type=text][r\\:model], input[type=date][r\\:model], input[type=datetime-local][r\\:model], input[type=email][r\\:model], input[type=number][r\\:model], input[type=month][r\\:model], input[type=password][r\\:model], input[type=range][r\\:model], input[type=search][r\\:model], input[type=tel][r\\:model], input[type=time][r\\:model], input[type=url][r\\:model], input[type=color][r\\:model], input[type=week][r\\:model], textarea[r\\:model]').forEach(model => {
                // Get properties
                const name = model.getAttribute('r:model').trim();
                const lazy = model.hasAttribute('r:lazy');
                const debounce = model.getAttribute('r:debounce') || 250;
                const value = this.getValueDotNotation(this.data, name);

                // Set initial value
                if(value !== undefined) model.value = value;

                // Remove previous binding event
                model.removeEventListener('input', model.listenerRef);

                // Set binding event
                model.listenerRef = () => {
                    // Sets the value
                    this.setValueDotNotation(this.data, name, model.value);

                    // On lazy update, ignore the refresh
                    if(lazy) return;

                    // Checks for deboucing
                    if(debounce) {
                        // Clear previous debouncing event
                        if(model.timeoutRef) clearTimeout(model.timeoutRef);

                        // Set debouncing event
                        model.timeoutRef = setTimeout(() => {
                            window.reactables.refresh(this, model);
                        }, debounce);
                    } else {
                        // No debounce, refresh instantly
                        window.reactables.refresh(this, model);
                    }
                };

                // Sets the listener
                model.addEventListener('input', model.listenerRef);

                // Remove attributes
                model.removeAttribute('r:model');
                model.removeAttribute('r:lazy');
                model.removeAttribute('r:debounce');
            });

            // Checkboxes and radios
            this.find('input[type=checkbox][r\\:model], input[type=radio][r\\:model]').forEach(model => {
                // Get properties
                const name = model.getAttribute('r:model').trim();
                const lazy = model.hasAttribute('r:lazy');
                const debounce = model.getAttribute('r:debounce');
                const rawName = name.replace('[]', '');
                const custom = model.getAttribute('value');
                const value = this.getValueDotNotation(this.data, rawName);

                // Set initial value for array
                if(name.endsWith('[]')) {
                    if(Array.isArray(value) && custom) {
                        if(value.some(v => v == custom)) model.checked = true;
                    }
                } else {
                    // Set initial single value
                    if(value !== undefined) {
                        // Custom value
                        if(custom) {
                            if(value == custom) model.checked = true;
                        } else {
                            // Default value
                            model.checked = value;
                        }
                    }
                }

                // Clear previous binding event
                model.removeEventListener('input', model.listenerRef);

                // Set binding event
                model.listenerRef = () => {
                    // Set value for array
                    if(name.endsWith('[]')) {
                        if(!Array.isArray(value)) value = [];
                        if(custom) {
                            if(model.checked) {
                                value.push(custom);
                            } else {
                                let idx = value.findIndex(v => v == custom);
                                if(idx !== -1) value.splice(idx, 1);
                            }
                        }

                        this.setValueDotNotation(this.data, rawName, value);
                    } else {
                        // Sets a single value, custom or default
                        if(custom) {
                            this.setValueDotNotation(this.data, name, (model.checked ? custom : false));
                        } else {
                            this.setValueDotNotation(this.data, name, model.checked);
                        }
                    }

                    // Ignore on lazy updates
                    if(lazy) return;

                    // Checks for debouncing
                    if(debounce) {
                        // Clear previous timeout
                        if(model.timeoutRef) clearTimeout(model.timeoutRef);

                        // Sets the new timeout
                        model.timeoutRef = setTimeout(() => {
                            window.reactables.refresh(this, model);
                        }, debounce);
                    } else {
                        // Or just refresh instantly
                        window.reactables.refresh(this, model);
                    }
                };

                // Adds the listener
                model.addEventListener('input', model.listenerRef);

                // Remove attributes
                model.removeAttribute('r:model');
                model.removeAttribute('r:lazy');
                model.removeAttribute('r:debounce');
            });

            // Selects
            this.find('select[r\\:model]').forEach(model => {
                // Get properties
                const name = model.getAttribute('r:model').trim();
                const lazy = model.hasAttribute('r:lazy');
                const debounce = model.getAttribute('r:debounce');
                const rawName = name.replace('[]', '');
                const value = this.getValueDotNotation(this.data, rawName);

                // Sets the initial value for array
                if(name.endsWith('[]')) {
                    if(Array.isArray(value)) {
                        Array.from(model.options).forEach(option => {
                            if(value.some(v => v == option.value)) option.selected = true;
                        });
                    }
                } else {
                    // Sets initial single value
                    if(value !== undefined) model.value = value;
                }

                // Clear previous binding event
                model.removeEventListener('input', model.listenerRef);

                // Creates the listener
                model.listenerRef = () => {
                    // For arrays of values
                    if(name.endsWith('[]')) {
                        let newValue = [];
                        Array.from(model.selectedOptions).forEach(option => {
                            newValue.push(option.value);
                        });
                        this.setValueDotNotation(this.data, rawName, newValue);
                    } else {
                        // For single value
                        this.setValueDotNotation(this.data, rawName, model.value);
                    }

                    // Ignore lazy updates
                    if(lazy) return;

                    // Checks for debouncing
                    if(debounce) {
                        // Clear previous timeout ref
                        if(model.timeoutRef) clearTimeout(model.timeoutRef);

                        // Creates the new timeout
                        model.timeoutRef = setTimeout(() => {
                            window.reactables.refresh(this, model);
                        }, debounce);
                    } else {
                        // Or update instantly
                        window.reactables.refresh(this, model);
                    }
                };

                // Adds the listener
                model.addEventListener('input', model.listenerRef);

                // Remove attributes
                model.removeAttribute('r:model');
                model.removeAttribute('r:lazy');
                model.removeAttribute('r:debounce');
            });

            // File inputs
            this.find('input[type=file][r\\:model]').forEach(model => {
                const name = model.getAttribute('r:model').trim();
                const lazy = model.hasAttribute('r:lazy');
                const debounce = model.getAttribute('r:debounce');

                // Clear previous binding event
                model.removeEventListener('input', model.listenerRef);

                // Creates a new listener
                model.listenerRef = () => {
                    // Get the selected files
                    this.files[name] = model.files;

                    // Ignore on lazy updates
                    if(lazy) return;

                    // Checks for debouncing
                    if(debounce) {
                        // Clears previous timeout
                        if(model.timeoutRef) clearTimeout(model.timeoutRef);

                        // Sets the new timeout
                        model.timeoutRef = setTimeout(() => {
                            window.reactables.refresh(this, model);
                        }, debounce);
                    } else {
                        // Or update instantly
                        window.reactables.refresh(this, model);
                    }
                };

                // Adds the listener
                model.addEventListener('input', model.listenerRef);

                // Remove attributes
                model.removeAttribute('r:model');
                model.removeAttribute('r:lazy');
                model.removeAttribute('r:debounce');
            });
        }

        /**
         * Gets a value from an object in dot notation.
         * @param {object} object Object to get value.
         * @param {string} path Path to search for.
         * @returns Returns the value found.
         */
        getValueDotNotation(object, path) {
            return path.split('.').reduce((a, b) => a[b], object);
        }

        /**
         * Sets a value in an object in dot notation.
         * @param {object} object Object to set value.
         * @param {string|string[]} path Path to set value.
         * @param {*} value Value to set.
         */
        setValueDotNotation(object, path, value) {
            if(!Array.isArray(path)) path = path.split('.');
            if(path.length === 1) {
                object[path[0]] = value;
            } else {
                if(object[path[0]]) {
                    return this.setValueDotNotation(object[path[0]], path.slice(1), value);
                } else {
                    object[path[0]] = {};
                    return this.setValueDotNotation(object[path[0]], path.slice(1), value);
                }
            }
        };

        /**
         * Binds actions to events.
         */
        bindEvents() {
            // Submit
            this.find('[r\\:submit]').forEach(el => {
                this.defaultEventBinder(el, 'submit', 'r:submit');
            });

            // Change
            this.find('[r\\:change]').forEach(el => {
                this.defaultEventBinder(el, 'change', 'r:change');
            });

            // Focus
            this.find('[r\\:focus]').forEach(el => {
                this.defaultEventBinder(el, 'focus', 'r:focus');
            });

            // Blur
            this.find('[r\\:blur]').forEach(el => {
                this.defaultEventBinder(el, 'blur', 'r:blur');
            });

            // Click
            this.find('[r\\:click]').forEach(el => {
                this.defaultEventBinder(el, 'click', 'r:click');
            });

            // Mouse hover
            this.find('[r\\:hover]').forEach(el => {
                this.defaultEventBinder(el, 'mouseover', 'r:hover');
            });

            // Mouse move
            this.find('[r\\:move]').forEach(el => {
                this.defaultEventBinder(el, 'mousemove', 'r:move');
            });

            // Mouse leave
            this.find('[r\\:leave]').forEach(el => {
                this.defaultEventBinder(el, 'mouseleave', 'r:leave');
            });

            // Enter key
            this.find('[r\\:enter]').forEach(el => {
                this.defaultEventBinder(el, 'keydown', 'r:enter', 'Enter');
            });

            // Tab key
            this.find('[r\\:tab]').forEach(el => {
                this.defaultEventBinder(el, 'keydown', 'r:tab', 'Tab');
            });

            // Esc key
            this.find('[r\\:esc]').forEach(el => {
                this.defaultEventBinder(el, 'keydown', 'r:esc', 'Escape');
            });
        }

        /**
         *
         * @param {Element} el Element to be bound.
         * @param {string} event Event name.
         * @param {string} attr Attribute.
         * @param {string|false} key Keypress validator.
         */
        defaultEventBinder(el, event, attr, key = false) {
            // Get properties
            const value = el.getAttribute(attr).trim();
            const follow = el.hasAttribute('r:follow');
            const debounce = el.getAttribute('r:debounce');
            const confirm = el.getAttribute('r:confirm');

            // Clear previous binding event
            const refName = event + 'Ref';
            el.removeEventListener(event, el[refName]);

            // Creates the binding event
            el[refName] = e => {
                // Checks for key input
                if(key && e.key !== key) return;

                // Checks for confirmation
                if(confirm && !window.confirm(confirm)) return e.preventDefault();

                // Follow default event
                if(!follow) e.preventDefault();

                // Checks for debouncings
                if(debounce) {
                    // Clear previous debouncing event
                    const debounceRefName = event + 'DebounceRef';
                    if(el[debounceRefName]) clearTimeout(el[debounceRefName]);

                    // Creates the debouncing event
                    el[debounceRefName] = setTimeout(() => {
                        window.reactables.refresh(this, el, value);
                    }, debounce);
                } else {
                    // Or updates instantly
                    window.reactables.refresh(this, el, value);
                }
            };

            // Adds the listener
            el.addEventListener(event, el[refName]);

            // Remove attributes
            el.removeAttribute(attr);
            el.removeAttribute('r:follow');
            el.removeAttribute('r:debounce');
            el.removeAttribute('r:confirm');
        }

        /**
         * Binds the repeat calls.
         */
        bindRepeats() {
            this.find('[r\\:repeat][r\\:interval]').forEach(el => {
                // Get properties
                const value = el.getAttribute('r:repeat').trim();
                const interval = el.getAttribute('r:interval');
                const timeout = el.getAttribute('r:timeout');

                // Checks for timeout
                if(timeout) {
                    // Clear previous timeout
                    if(el.repeatTimeoutRef) clearTimeout(el.repeatTimeoutRef);

                    // Create new timeout
                    el.repeatTimeoutRef = setTimeout(() => {
                        // Clear previous interval
                        if(el.repeatIntervalRef) clearInterval(el.repeatIntervalRef);

                        // Creates new interval
                        el.repeatIntervalRef = setInterval(() => {
                            window.reactables.refresh(this, el, value);
                        }, interval);
                    }, timeout);
                } else {
                    // Clear previous interval
                    if(el.repeatIntervalRef) clearInterval(el.repeatIntervalRef);

                    // Creates new interval
                    el.repeatIntervalRef = setInterval(() => {
                        window.reactables.refresh(this, el, value);
                    }, interval);
                }

                // Remove attributes
                el.removeAttribute('r:repeat');
                el.removeAttribute('r:interval');
                el.removeAttribute('r:timeout');
            });
        }

        /**
         * Run init functions.
         */
        runInits() {
            this.find('[r\\:init]').forEach(el => {
                // Get properties
                const value = el.getAttribute('r:init').trim();
                const timeout = el.getAttribute('r:timeout');

                // Checks for timeout
                if(timeout) {
                    // Clear previous timeout
                    if(el.initTimeoutRef) clearTimeout(el.initTimeoutRef);

                    // Set new timeout
                    el.initTimeoutRef = setTimeout(() => {
                        window.reactables.refresh(this, el, value);
                    }, timeout);
                } else {
                    // Update instantly
                    window.reactables.refresh(this, el, value);
                }

                // Remove attributes
                el.removeAttribute('r:init');
                el.removeAttribute('r:timeout');
            });
        }

        /**
         * Remove init attributes.
         */
        removeInits() {
            this.find('[r\\:init]').forEach(el => {
                // Remove attributes
                el.removeAttribute('r:init');
                el.removeAttribute('r:timeout');
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

        /**
         * Parses navigation links.
         */
        parseNavigateLinks() {
            this.find('[r\\:navigate]').forEach(el => {
                // Get target URL
                let target = el.getAttribute('href').trim();

                // Clear previous binding event
                el.removeEventListener('click', el.navigateRef);

                // Sets the new event
                el.navigateRef = event => {
                    event.preventDefault();
                    window.reactables.navigate(target);
                };

                // Add listener
                el.addEventListener('click', el.navigateRef);

                // Remove attribute
                el.removeAttribute('r:navigate');
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
            this.components = [];
            document.querySelectorAll('[r\\:id]').forEach(el => {
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
         * @param {Function} callback Custom error handler function. The function receives the response object.
         */
        onError(callback) {
            this.errorHandler = callback;
        }

        /**
         * Sets a custom Page Expired error handler.
         * @param {Function} callback Custom page expired handler function. The function receives the response object.
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
         * Refreshes all components in the page.
         */
        refreshAll() {
            this.components.forEach(component => {
                this.refresh(component);
            });
        }

        /**
         * Refreshes a component.
         * @param {ReactablesComponent} component Component to be refreshed.
         * @param {?Element} el Element that called the refresh.
         * @param {?string} method Method call, if any.
         */
        refresh(component, el = null, method = null) {
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
            xhr.open('POST', component.baseUrl + 'reactables/update', true);
            xhr.setRequestHeader('X-Reactables', true);

            // Upload start event
            xhr.upload.onloadstart = () => {
                let event = new Event('reactables-upload-start');
                if(el) el.dispatchEvent(event);
            }

            // Upload progress event
            xhr.upload.onprogress = e => {
                let percent = Math.round((e.loaded / e.total) * 100);
                let event = new CustomEvent('reactables-upload-progress', {detail: percent});
                if(el) el.dispatchEvent(event);
            }

            // Upload success event
            xhr.upload.onload = () => {
                let event = new Event('reactables-upload-success');
                if(el) el.dispatchEvent(event);
            }

            // Upload error event
            xhr.upload.onerror = () => {
                let event = new Event('reactables-upload-failed');
                if(el) el.dispatchEvent(event);
            }

            // Load event
            xhr.onload = () => {
                if(xhr.status == 200) {
                    try {
                        // Parse response
                        let response = JSON.parse(xhr.responseText);
                        if(!response.status) return xhr.onerror();

                        // Redirect
                        if(response.redirect) return location.href = response.redirect;

                        // Morphs the HTML
                        morphdom(component.el, response.html, {

                            // Parse new elements
                            onNodeAdded: node => {
                                if(node.hasAttribute('r:id')) {
                                    window.reactables.components.push(new ReactablesComponent(node));
                                    node.skipAddingChildren = true;
                                }
                            },

                            // Return unique element key
                            getNodeKey: node => {
                                return node.getAttribute('r:key') || node.id;
                            },

                            // Prevent nested components to be updated
                            onBeforeElUpdated: (from, to) => {
                                if(from.hasAttribute('r:id') && from.getAttribute('r:id') !== component.id) return false;
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

                        // Parse navigation links
                        component.parseNavigateLinks();

                        // Toggle loading elements
                        component.toggleLoads();

                        // Remove inits
                        component.removeInits();

                        // Dispatch update event
                        let event = new Event('reactables-update-success');
                        component.el.dispatchEvent(event);
                    } catch(error) {
                        console.error(error);
                        xhr.onerror();
                    }
                } else if(xhr.status == 403) {
                    // Page expired handler
                    if(window.reactables.expiredHandler) {
                        window.reactables['expiredHandler']({
                            status: xhr.status,
                            body: xhr.responseText
                        });
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
                    window.reactables['errorHandler']({
                        status: xhr.status,
                        body: xhr.responseText
                    });
                } else {
                    window.reactables.showError(xhr.responseText);
                }
            }

            // Perform request
            xhr.send(data);
        }

        /**
         * Navigates to an URL and replace document contents.
         * @param {string} url URL to navigate to.
         */
        navigate(url) {
            // Create request
            let xhr = new XMLHttpRequest();
            xhr.responseType = 'document';
            xhr.withCredentials = true;
            xhr.open('GET', url, true);
            xhr.setRequestHeader('X-Reactables', true);

            // Save current head scripts
            let headScripts = Array.from(document.head.querySelectorAll('script'));

            // Load event
            xhr.onload = () => {
                if(xhr.status == 200) {
                    try {
                        // Check for redirect header
                        let redirect = xhr.getResponseHeader('X-Reactables-Redirect');
                        if(redirect) return window.location = redirect;

                        // Change document body
                        document.body = xhr.response.body;

                        // Change document title and URL
                        if(xhr.response.title) document.title = xhr.response.title;
                        history.pushState({}, '', url);

                        // Reinitialize reactables
                        window.reactables.init();

                        // Run new scripts from head
                        if(xhr.response.head) xhr.response.head.querySelectorAll('script').forEach(oldScriptEl => {
                            if(oldScriptEl.hasAttribute('r:once')) return;

                            // Check if script already exists
                            if(headScripts.some(script => script.attributes === oldScriptEl.attributes || script.textContent === oldScriptEl.textContent)) return;

                            // Create new script instance and replace it
                            let newScriptEl = document.createElement('script');
                            Array.from(oldScriptEl.attributes).forEach(attr => newScriptEl.setAttribute(attr.name, attr.value));
                            newScriptEl.textContent = oldScriptEl.textContent;
                            document.head.appendChild(newScriptEl);
                        });

                        // Run all scripts from body
                        document.body.querySelectorAll('script').forEach(oldScriptEl => {
                            if(oldScriptEl.hasAttribute('r:once')) return;

                            // Create new script instance and replace it
                            let newScriptEl = document.createElement('script');
                            Array.from(oldScriptEl.attributes).forEach(attr => newScriptEl.setAttribute(attr.name, attr.value));
                            newScriptEl.textContent = oldScriptEl.textContent;
                            oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
                        });

                        // Call navigated event
                        let event = new CustomEvent('reactables-navigated');
                        document.dispatchEvent(event);
                    } catch(error) {
                        console.error(error);
                        xhr.onerror();
                    }
                } else {
                    // Error
                    xhr.onerror();
                }
            }

            // Error event
            xhr.onerror = () => {
                if(window.reactables.errorHandler) {
                    window.reactables['errorHandler']({
                        status: xhr.status,
                        body: xhr.response.documentElement.outerHTML
                    });
                } else {
                    window.reactables.showError(xhr.response.documentElement.outerHTML);
                }
            }

            // Call navigating event
            let event = new CustomEvent('reactables-navigating');
            document.dispatchEvent(event);

            // Perform request
            xhr.send();
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