/**
 * Global Drag and Drop Suppression
 * Ensures the browser does not navigate away when a file is dropped accidentally.
 */
(function() {
    const preventDefaults = (e) => {
        e.preventDefault();
        // Do not use stopPropagation or stopImmediatePropagation here, 
        // as we want other elements (like the dropZone) to still hear the event.
    };

    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
    
    events.forEach(eventName => {
        window.addEventListener(eventName, preventDefaults, false);
        document.addEventListener(eventName, preventDefaults, false);
    });

    console.log("Drag-and-drop suppression active.");
})();
