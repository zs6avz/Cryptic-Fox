/**
 * Global Drag and Drop Suppression
 * Ensures the browser does not navigate away when a file is dropped accidentally.
 * Uses capture phase (true) so preventDefault fires before any element handler.
 */
(function() {
    const preventDefaults = (e) => {
        e.preventDefault();
    };

    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
    
    events.forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, true);
    });

    console.log("Drag-and-drop suppression active.");
})();
