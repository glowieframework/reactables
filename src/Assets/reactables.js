class ReactablesComponent {

    constructor(el) {
        // Parse component
        this.el = el;
        this.id = this.el.getAttribute('r-id');
        this.data = JSON.parse(this.el.getAttribute('r-data'));

        // Remove attributes
        this.el.removeAttribute('r-data');
        this.el.removeAttribute('r-id');

        // Bind stuff
        this.bind();
    }

    bind() {
        this.bind_models();
        this.bind_events();
    }

    bind_models() {
        // Inputs
        this.el.querySelectorAll('input[type=text][r-model]').forEach(model => {
            // Set initial value
            let value = this.data[model.getAttribute('r-model')];
            if(value !== undefined) model.value = value;

            // Set binding event
            model.addEventListener('input', () => {
                this.data[model.getAttribute('r-model')] = model.value;
                this.refresh();
            });
        });

        // Checkboxes
        this.el.querySelectorAll('input[type=checkbox][r-model]').forEach(model => {
            // Set initial value
            let value = this.data[model.getAttribute('r-model')];
            if(value !== undefined) model.checked = value;

            // Set binding event
            model.addEventListener('input', () => {
                this.data[model.getAttribute('r-model')] = model.checked;
                this.refresh();
            });
        });
    }

    bind_events() {
        // Clicks
        this.el.querySelectorAll('[r-click]').forEach(el => {
            el.addEventListener('click', () => {
                this.refresh('method', el.getAttribute('r-click'));
            });
        });
    }

    refresh(type = 'model', extra = null) {
        $.post('reactables/component', JSON.stringify({
            id: this.id,
            type: type,
            data: this.data,
            extra: extra
        }), response => {
            this.el.innerHTML = response.html;
            this.data = JSON.parse(response.data);
            this.bind();
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