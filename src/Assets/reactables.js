class ReactablesComponent {

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
    }

    toggle_loads(ready = true) {
        if(ready) {
            this.el.querySelectorAll('[r-loading]').forEach(el => {
                let attr = el.getAttribute('r-loading');
                el.style.display = attr.length ? attr : 'none';
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
                let attr = el.getAttribute('r-ready');
                el.style.display = attr.length ? attr : 'none';
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

    remove_attrs() {
        this.el.removeAttribute('r-data');
        this.el.removeAttribute('r-id');
        this.el.removeAttribute('r-checksum');
    }

    bind(listen = false) {
        this.bind_models(listen);
        this.bind_events(listen);
    }

    bind_models(listen = false) {
        // Inputs
        this.el.querySelectorAll('input[type=text][r-model], input[type=date][r-model], input[type=datetime-local][r-model], input[type=email][r-model], input[type=number][r-model], input[type=month][r-model], input[type=password][r-model], input[type=search][r-model], input[type=range][r-model], input[type=search][r-model], input[type=tel][r-model], input[type=time][r-model], input[type=url][r-model], input[type=color][r-model], input[type=week][r-model], textarea[r-model]').forEach(model => {
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
            let custom = model.getAttribute('r-value');
            let value = this.data[qualifiedName];

            // Array
            if(name.endsWith('[]')) {
                if(Array.isArray(value) && custom) {
                    if(value.includes(custom)) model.checked = true;
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
                            let idx = this.data[qualifiedName].indexOf(custom);
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
            model.removeAttribute('r-value');
        });
    }

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

            // Remove attribute
            el.removeAttribute('r-click');
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

            // Remove attribute
            el.removeAttribute('r-submit');
        });
    }

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
            morphdom(this.el, response.html);

            // Parses the new data
            this.data = JSON.parse(this.el.getAttribute('r-data'));

            // Toggle loading elements
            this.toggle_loads();

            // Remove attributes
            this.remove_attrs();

            // Bind stuff
            this.bind();
        }).fail(error => {
            this.el.innerHTML = error.responseText;
        });
    }
}

class Reactables {
    components = [];

    init() {
        // Initialize components
        document.querySelectorAll('[r-id]').forEach(el => {
            this.components.push(new ReactablesComponent(el));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reactables = new Reactables();
    window.reactables.init();
});