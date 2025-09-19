const popoverInvokerMap = new WeakMap();

document.addEventListener('DOMContentLoaded', () => {
    const themePopover = document.getElementById('themeHelpPopover');
    const helpButton = document.getElementById('themeHelpButton');
    const invokerDescription = document.getElementById('themeHelpInvoker');

    if (!themePopover || typeof themePopover.showPopover !== 'function') {
        if (helpButton) {
            helpButton.hidden = true;
        }
        return;
    }

    const clearInvokerMessage = () => {
        if (invokerDescription) {
            invokerDescription.hidden = true;
            invokerDescription.textContent = '';
        }
    };

    themePopover.addEventListener('toggle', (event) => {
        const popover = event.target;
        if (!popover) return;

        const nextState = typeof event.newState === 'string'
            ? event.newState
            : (popover.matches(':popover-open') ? 'open' : 'closed');

        if (nextState === 'open') {
            let sourceElement = null;
            if ('source' in event && event.source instanceof HTMLElement) {
                sourceElement = event.source;
            } else if (document.activeElement instanceof HTMLElement) {
                sourceElement = document.activeElement;
            }

            if (sourceElement) {
                popoverInvokerMap.set(popover, sourceElement);
                if (invokerDescription) {
                    const labelText = sourceElement.getAttribute('aria-label')
                        || sourceElement.textContent?.trim()
                        || sourceElement.dataset?.theme
                        || '';
                    if (labelText) {
                        invokerDescription.textContent = `Opened from the ${labelText} control.`;
                        invokerDescription.hidden = false;
                    } else {
                        clearInvokerMessage();
                    }
                }
            } else {
                clearInvokerMessage();
            }
        } else {
            const storedInvoker = popoverInvokerMap.get(popover);
            popoverInvokerMap.delete(popover);
            clearInvokerMessage();

            if (storedInvoker && document.contains(storedInvoker) && typeof storedInvoker.focus === 'function') {
                storedInvoker.focus();
            }
        }
    });
});

