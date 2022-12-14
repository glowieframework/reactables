class ReactablesComponent {

    constructor(el) {
        // Parse component
        this.el = el;
        this.id = this.el.getAttribute('r-id');
        this.checksum = this.el.getAttribute('r-checksum');
        this.data = JSON.parse(this.el.getAttribute('r-data'));

        // Remove attributes
        this.el.removeAttribute('r-data');
        this.el.removeAttribute('r-id');
        this.el.removeAttribute('r-checksum');

        // Bind stuff
        this.bind(true);
    }

    bind(listen = false) {
        this.bind_models(listen);
        this.bind_events(listen);
    }

    bind_models(listen = false) {
        // Inputs
        this.el.querySelectorAll('input[type=text][r-model]').forEach(model => {
            // Set initial value
            let name = model.getAttribute('r-model');
            let value = this.data[name];
            let lazy = model.hasAttribute('r-lazy');
            if(value !== undefined) model.value = value;

            // Set binding event
            if(listen) model.addEventListener('input', () => {
                this.data[name] = model.value;
                if(!lazy) this.refresh();
            });

            // Remove attributes
            model.removeAttribute('r-model');
            model.removeAttribute('r-lazy');
        });

        // Checkboxes
        this.el.querySelectorAll('input[type=checkbox][r-model]').forEach(model => {
            // Set initial value
            let name = model.getAttribute('r-model');
            let value = this.data[name];
            let lazy = model.hasAttribute('r-lazy');
            if(value !== undefined) model.checked = value;

            // Set binding event
            if(listen) model.addEventListener('input', () => {
                this.data[name] = model.checked;
                if(!lazy) this.refresh();
            });

            // Remove attributes
            model.removeAttribute('r-model');
            model.removeAttribute('r-lazy');
        });
    }

    bind_events(listen = false) {
        // Clicks
        this.el.querySelectorAll('[r-click]').forEach(el => {
            // Get value
            let value = el.getAttribute('r-click');

            // Set binding event
            if(listen) el.addEventListener('click', () => {
                this.refresh('method', value);
            });

            // Remove attribute
            el.removeAttribute('r-click');
        });
    }

    refresh(type = 'model', extra = null) {
        $.post('reactables/component', JSON.stringify({
            id: this.id,
            checksum: this.checksum,
            type: type,
            data: this.data,
            extra: extra
        }), response => {
            if(response.status === true) {
                this.data = JSON.parse(response.data);
                morphdom(this.el.children[0], response.html);
                this.bind();
            } else {
                console.log(response.error);
            }
        });
    }
}

class Reactables {
    components = [];

    init() {
        // Initialize components
        document.querySelectorAll('r-component').forEach(el => {
            this.components.push(new ReactablesComponent(el));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reactables = new Reactables();
    window.reactables.init();
});