/**
 * Faux console log utility
 * Written by Moti Granovsky, Sisense DevX, 2020
 * ---------------------------------------------
 * 
 * This utility wraps `console.log` to write the same output to a faux log DOM element on the page.
 * **This is not required in any way to use the Sisense Embed SDK!**
 */
(function(w) {

    /**
     * @class
     * @param {DOMElement} el DOM element to append log messages to
     */
    function Logger(el) {
        this._outputEl = el;
        this.log('~ Output console initialized')
    }

    /**
     * Log a message to both the UI and the console
     * @param {string} message The message to output
     */
    Logger.prototype.log = function(message) {
        // Output the message to the console
        console.log(message);
        // Create an element for the new message
        var newMessageElement = document.createElement('div');
        newMessageElement.innerText = message;
        newMessageElement.classList.add('console-line');
        // Append element to end of current log container
        this._outputEl.appendChild(newMessageElement);   
        // Adjust scrolling to show latest message
        this._outputEl.scrollTop = this._outputEl.scrollHeight;
    }

    w.Logger = Logger;

})(window);