import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function Tooltip({ content, onClose, triggerElement }) {
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1025px)').matches);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1025px)');
        const handler = (e) => setIsDesktop(e.matches);

        // Add listener
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!content) return null;

    // Render Side Panel for Desktop
    if (isDesktop) {
        let topOffset = 0;
        if (triggerElement) {
            const container = document.getElementById('main-content');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const triggerRect = triggerElement.getBoundingClientRect();
                // Calculate relative position.
                // We want the top of the tooltip to align with the trigger button.
                // We also need to clamp it so it doesn't go below the bottom or too high (though flex-start handles top).
                // Since main-content has padding, we need to account for that if using absolute calculation,
                // but since it's a flex item, margin-top works relative to the flex line start.

                // Relative top from the container's content box
                const relativeTop = triggerRect.top - containerRect.top;

                // Adjust for some padding or visual alignment (center of button?)
                // Let's align top-to-top roughly.
                topOffset = Math.max(0, relativeTop - 20); // -20 to account for container padding/margins if needed or visual preference

                // We could also cap it to prevent overflow, but flex container might handle height.
                // However, scrolling is inside components. 
            }
        }

        return createPortal(
            <div id="tooltip-side-panel" style={{ marginTop: `${topOffset}px` }}>
                <div className="tooltip-side-panel-header">
                    <h2>More Information</h2>
                    <button className="close-icon" onClick={onClose}>&times;</button>
                </div>
                <div className="tooltip-side-panel-content" dangerouslySetInnerHTML={{ __html: content }} />
            </div>,
            document.getElementById('main-content') // Ensure this exists in App layout
        );
    }

    // Render Modal for Mobile
    return createPortal(
        <div className="tooltip-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="tooltip-modal-content">
                <button className="close-icon" onClick={onClose}>&times;</button>
                <div dangerouslySetInnerHTML={{ __html: content }} />
                <div className="tooltip-modal-footer">
                    <button className="close-tooltip" onClick={onClose}>Got it</button>
                </div>
            </div>
        </div>,
        document.body
    );
}
