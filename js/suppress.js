/**
 * Global Drag and Drop Suppression
 * Ensures the browser does not navigate away when a file is dropped accidentally.
 */
(function() {
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    };

    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
    
    events.forEach(eventName => {
        window.addEventListener(eventName, preventDefaults, { capture: true, passive: false });
        document.addEventListener(eventName, preventDefaults, { capture: true, passive: false });
    });

    console.log("Drag-and-drop suppression active.");
})();
