document.addEventListener('DOMContentLoaded', () => {
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