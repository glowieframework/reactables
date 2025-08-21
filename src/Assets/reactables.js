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

        // Dispatch browser ready event
        const ready = new Event('reactables:ready');
        document.dispatchEvent(ready);

        // Dispatch mounted events
        this.components.forEach(component => {
            component.dispatchComponentEvents([{
                name: 'reactables:mounted'
            }]);
        });
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
        if(!this.listeners[eventName]) this.listeners[eventName] = [];
        this.listeners[eventName].push(callback);
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
        const html = document.createElement('html');
        html.innerHTML = error;

        // Create error modal
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;padding:30px;z-index:999999;background:rgba(0,0,0,.7);';

        // Create error iframe
        const iframe = document.createElement('iframe');
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
     * @param {?array} params Method params, if any.
     */
    refresh(component, el = null, method = null, params = null) {
        // Toggle loading elements
        component.toggleLoads(false);

        // Wrap request data
        const data = new FormData();
        data.append('id', component.id);
        data.append('name', component.name);
        data.append('data', JSON.stringify(component.data));
        data.append('checksum', component.checksum);
        data.append('route', component.route);

        // Append method calls and params
        if(method) {
            data.append('method', method);
            if(params && params.length) data.append('params', JSON.stringify(params));
        }

        // Append uploaded files, if any
        for(const key in component.files) {
            Array.from(component.files[key]).forEach(file => {
                data.append(key + '[]', file);
            });
        }

        // Create request
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'text';
        xhr.withCredentials = true;
        xhr.open('POST', component.baseUrl + 'reactables/update', true);
        xhr.setRequestHeader('X-Reactables', true);

        // Upload start event
        xhr.upload.onloadstart = e => {
            component.dispatchComponentEvents([{
                name: 'reactables:uploading',
                params: {
                    loaded: e.loaded,
                    total: e.total,
                    percent: 0
                }
            }]);
        }

        // Upload progress event
        xhr.upload.onprogress = e => {
            const percent = Math.round((e.loaded / e.total) * 100);
            component.dispatchComponentEvents([{
                name: 'reactables:progress',
                params: {
                    loaded: e.loaded,
                    total: e.total,
                    percent: percent
                }
            }]);
        }

        // Upload finished event
        xhr.upload.onload = e => {
            component.dispatchComponentEvents([{
                name: 'reactables:uploaded',
                params: {
                    loaded: e.loaded,
                    total: e.total,
                    percent: 100
                }
            }]);
        }

        // Upload error event
        xhr.upload.onerror = e => {
            component.dispatchComponentEvents([{
                name: 'reactables:failed'
            }]);
        }

        // Begin update event
        xhr.onloadstart = () => {
            component.dispatchComponentEvents([{
                name: 'reactables:updating'
            }]);
        }

        // Load event
        xhr.onload = () => {
            if(xhr.status == 200) {
                try {
                    // Parse response
                    const response = JSON.parse(xhr.responseText);
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
                    component.dispatchEvents(response.events.global);
                    component.dispatchComponentEvents(response.events.component);
                    component.dispatchBrowserEvents(response.events.browser);

                    // Parse navigation links
                    component.parseNavigateLinks();

                    // Toggle loading elements
                    component.toggleLoads();

                    // Remove inits
                    component.removeInits();

                    // Dispatch update event
                    component.dispatchComponentEvents([{
                        name: 'reactables:updated'
                    }]);
                } catch(error) {
                    console.error(error);
                    xhr.onerror();
                }
            } else if(xhr.status == 403) {
                // Page expired handler
                if(window.reactables.expiredHandler) {
                    window.reactables.expiredHandler({
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
            // Dispatch event
            component.dispatchComponentEvents([{
                name: 'reactables:error'
            }]);

            // Global handler
            if(window.reactables.errorHandler) {
                window.reactables.errorHandler({
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
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'document';
        xhr.withCredentials = true;
        xhr.open('GET', url, true);
        xhr.setRequestHeader('X-Reactables', true);

        // Save current head scripts
        const headScripts = Array.from(document.head.querySelectorAll('script'));

        // Load event
        xhr.onload = () => {
            if(xhr.status == 200) {
                try {
                    // Check for redirect header
                    const redirect = xhr.getResponseHeader('X-Reactables-Redirect');
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
                        const newScriptEl = document.createElement('script');
                        Array.from(oldScriptEl.attributes).forEach(attr => newScriptEl.setAttribute(attr.name, attr.value));
                        newScriptEl.textContent = oldScriptEl.textContent;
                        document.head.appendChild(newScriptEl);
                    });

                    // Run all scripts from body
                    document.body.querySelectorAll('script').forEach(oldScriptEl => {
                        if(oldScriptEl.hasAttribute('r:once')) return;

                        // Create new script instance and replace it
                        const newScriptEl = document.createElement('script');
                        Array.from(oldScriptEl.attributes).forEach(attr => newScriptEl.setAttribute(attr.name, attr.value));
                        newScriptEl.textContent = oldScriptEl.textContent;
                        oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
                    });

                    // Call navigated event on document
                    const event = new CustomEvent('reactables:navigated');
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
                window.reactables.errorHandler({
                    status: xhr.status,
                    body: xhr.response.documentElement.outerHTML
                });
            } else {
                window.reactables.showError(xhr.response.documentElement.outerHTML);
            }
        }

        // Call navigating event on document
        const event = new CustomEvent('reactables:navigating');
        document.dispatchEvent(event);

        // Perform request
        xhr.send();
    }
}