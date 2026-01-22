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
        // Calculate position if needed, or just standard side panel
        return createPortal(
            <div id="tooltip-side-panel">
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
