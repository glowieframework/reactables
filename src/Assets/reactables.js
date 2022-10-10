/**
 * Initializes all reactable components.
 */
function reactables_init() {
    // Get all components
    var reactables_components = document.querySelectorAll('r-component');

    reactables_components.forEach(component => {
        // Parse initial component data
        component.reactables_data = JSON.parse(component.getAttribute('r-data'));
        component.reactables_id = component.getAttribute('r-id');

        // Setup models
        reactables_update_models(component);

        // Setup events
        reactables_bind_events(component);
    });
}

function reactables_update_models(component) {
    // Get all text input component models
    component.querySelectorAll('input[r-model]').forEach(model => {
        // Set initial model values
        let value = component.reactables_data[model.getAttribute('r-model')];
        if(value !== undefined) model.value = value;

        // Set binding event
        model.addEventListener('input', () => {
            component.reactables_data[model.getAttribute('r-model')] = model.value;
            reactables_request(component, 'model');
        });
    });

    // Get all checkbox component models
    component.querySelectorAll('input[type=checkbox][r-model]').forEach(model => {
        // Set initial model values
        let value = component.reactables_data[model.getAttribute('r-model')];
        if(value !== undefined) model.checked = value;

        // Set binding event
        model.addEventListener('input', () => {
            component.reactables_data[model.getAttribute('r-model')] = model.checked;
            reactables_request(component, 'model');
        });
    });
}

function reactables_bind_events(component) {
    // Get all events
    component.querySelectorAll('[r-click]').forEach(element => {
        // Set binding event
        element.addEventListener('click', () => {
            reactables_request(component, 'method', element.getAttribute('r-click'));
        });
    });
}

function reactables_request(component, type, extra = null) {
    $.post('reactables/component', JSON.stringify({
        id: component.reactables_id,
        type: type,
        data: component.reactables_data,
        extra: extra
    }), response => {
        // Parses the refreshed component
        component.outerHTML = response;

        // Refreshes elements
        reactables_init();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    reactables_init();
});