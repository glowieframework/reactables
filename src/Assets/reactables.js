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
         *
         * @param {Element} el Component element.
         */
        constructor(el) {
            // Parse component
            this.el = el;
            this.id = this.el.getAttribute('r-id');
            this.checksum = this.el.getAttribute('r-checksum');
            this.data = JSON.parse(this.el.getAttribute('r-data'));

            // Toggle loading elements
            this.toggle_loads();

            // Remove attributes
            this.remove_attrs();

            // Bind stuff
            this.bind(true);

            // Run inits
            this.run_inits();
        }

        /**
         * Toggles the loading/ready elements.
         * @param {boolean} ready Ready state.
         */
        toggle_loads(ready = true) {
            if(ready) {
                this.el.querySelectorAll('[r-loading]').forEach(el => {
                    el.style.display = 'none';
                });

                this.el.querySelectorAll('[r-ready]').forEach(el => {
                    let attr = el.getAttribute('r-ready');
                    el.style.display = attr.length ? attr : 'inline-block';
                });

                this.el.querySelectorAll('[r-loading-class]').forEach(el => {
                    el.classList.remove(el.getAttribute('r-loading-class'));
                });

                this.el.querySelectorAll('[r-ready-class]').forEach(el => {
                    el.classList.add(el.getAttribute('r-ready-class'));
                });

                this.el.querySelectorAll('[r-loading-attr]').forEach(el => {
                    el.removeAttribute(el.getAttribute('r-loading-attr'));
                });

                this.el.querySelectorAll('[r-ready-attr]').forEach(el => {
                    el.setAttribute(el.getAttribute('r-loading-attr'), 'true');
                });
            } else {
                this.el.querySelectorAll('[r-loading]').forEach(el => {
                    let attr = el.getAttribute('r-loading');
                    el.style.display = attr.length ? attr : 'inline-block';
                });

                this.el.querySelectorAll('[r-ready]').forEach(el => {
                    el.style.display = 'none';
                });

                this.el.querySelectorAll('[r-loading-class]').forEach(el => {
                    el.classList.add(el.getAttribute('r-loading-class'));
                });

                this.el.querySelectorAll('[r-ready-class]').forEach(el => {
                    el.classList.remove(el.getAttribute('r-ready-class'));
                });

                this.el.querySelectorAll('[r-loading-attr]').forEach(el => {
                    el.setAttribute(el.getAttribute('r-loading-attr'), 'true');
                });

                this.el.querySelectorAll('[r-ready-attr]').forEach(el => {
                    el.removeAttribute(el.getAttribute('r-loading-attr'));
                });
            }
        }

        /**
         * Removes the attributes from the component.
         */
        remove_attrs() {
            this.el.removeAttribute('r-data');
            this.el.removeAttribute('r-id');
            this.el.removeAttribute('r-checksum');
        }

        /**
         * Binds component hooks.
         * @param {boolean} listen Create event listeners.
         */
        bind(listen = false) {
            this.bind_models(listen);
            this.bind_events(listen);
            this.bind_repeats(listen);
        }

        /**
         * Binds input models.
         * @param {boolean} listen Create event listeners.
         */
        bind_models(listen = false) {
            // Inputs
            this.el.querySelectorAll('input[type=text][r-model], input[type=date][r-model], input[type=datetime-local][r-model], input[type=email][r-model], input[type=number][r-model], input[type=month][r-model], input[type=password][r-model], input[type=range][r-model], input[type=search][r-model], input[type=tel][r-model], input[type=time][r-model], input[type=url][r-model], input[type=color][r-model], input[type=week][r-model], textarea[r-model]').forEach(model => {
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
            this.el.querySelectorAll('input[type=checkbox][r-model], input[type=radio][r-model]').forEach(model => {
                // Set initial value
                let name = model.getAttribute('r-model');
                let lazy = model.hasAttribute('r-lazy');
                let debounce = model.getAttribute('r-debounce');
                let debounceTimeout = null;
                let qualifiedName = name.replace('[]', '');
                let custom = model.getAttribute('value');
                let value = this.data[qualifiedName];

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
                        if(!Array.isArray(this.data[qualifiedName])) this.data[qualifiedName] = [];
                        if(custom) {
                            if(model.checked) {
                                this.data[qualifiedName].push(custom);
                            } else {
                                let idx = this.data[qualifiedName].findIndex(v => v == custom);
                                if(idx !== -1) this.data[qualifiedName].splice(idx, 1);
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
            this.el.querySelectorAll('select[r-model]').forEach(model => {
                // Set initial value
                let name = model.getAttribute('r-model');
                let lazy = model.hasAttribute('r-lazy');
                let debounce = model.getAttribute('r-debounce');
                let debounceTimeout = null;
                let qualifiedName = name.replace('[]', '');
                let value = this.data[qualifiedName];

                // Array
                if(name.endsWith('[]')) {
                    if(Array.isArray(value)) {
                        model.querySelectorAll('option').forEach(option => {
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
                        this.data[qualifiedName] = [];
                        Array.from(model.selectedOptions).forEach(option => {
                            this.data[qualifiedName].push(option.value);
                        });
                    } else {
                        this.data[qualifiedName] = model.value;
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
        }

        /**
         * Binds actions to events.
         * @param {boolean} listen Create event listeners.
         */
        bind_events(listen = false) {
            // Clicks
            this.el.querySelectorAll('[r-click]').forEach(el => {
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
            this.el.querySelectorAll('[r-submit]').forEach(el => {
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
            this.el.querySelectorAll('[r-focus]').forEach(el => {
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
            this.el.querySelectorAll('[r-blur]').forEach(el => {
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
            this.el.querySelectorAll('[r-hover]').forEach(el => {
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
            this.el.querySelectorAll('[r-leave]').forEach(el => {
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
            this.el.querySelectorAll('[r-enter]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-enter');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen) el.addEventListener('keydown', event => {
                    if(e.keyCode !== 13) return;
                    if(prevent) event.preventDefault();
                    this.refresh('method', value);
                });

                // Remove attributes
                el.removeAttribute('r-enter');
                el.removeAttribute('r-prevent');
            });

            // Tab key
            this.el.querySelectorAll('[r-tab]').forEach(el => {
                // Get value
                let value = el.getAttribute('r-tab');
                let prevent = el.hasAttribute('r-prevent');

                // Set binding event
                if(listen) el.addEventListener('keydown', event => {
                    if(e.keyCode !== 9) return;
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
        bind_repeats(listen = false) {
            this.el.querySelectorAll('[r-repeat][r-interval]').forEach(el => {
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
        run_inits() {
            this.el.querySelectorAll('[r-init]').forEach(el => {
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
        remove_inits() {
            this.el.querySelectorAll('[r-init]').forEach(el => {
                // Remove attributes
                el.removeAttribute('r-init');
                el.removeAttribute('r-timeout');
            });
        }

        /**
         * Refreshes the component.
         * @param {string} type Type of the AJAX call.
         * @param {?string} extra Extra data to pass with the request.
         */
        refresh(type = 'model', extra = null) {
            // Toggle loading elements
            this.toggle_loads(false);

            // Perform request
            $.post('reactables/component', JSON.stringify({
                id: this.id,
                checksum: this.checksum,
                type: type,
                data: this.data,
                extra: extra
            }), response => {
                // Morphs the HTML
                morphdom(this.el, response.html, {childrenOnly: true});

                // Parses the new data
                this.data = JSON.parse(response.data);

                // Toggle loading elements
                this.toggle_loads();

                // Bind stuff
                this.bind();

                // Remove inits
                this.remove_inits();
            }).fail(error => {
                this.el.innerHTML = error.responseText;
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
         * Initializes the Reactables core.
         */
        init() {
            // Initialize components
            document.querySelectorAll('[r-id][r-checksum][r-data]').forEach(el => {
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
    }

    // Checks for duplicated assets
    if(window.reactables) {
        console.error('[Reactables] You don\'t neet to included the assets more than once!');
        return;
    }

    // Init Reactables
    window.reactables = new Reactables();
    window.reactables.init();
});