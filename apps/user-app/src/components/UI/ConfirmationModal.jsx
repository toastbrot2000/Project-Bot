import React from 'react';

export function ConfirmationModal({ isOpen, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div id="confirmation-dialog">
            <div className="dialog-content">
                <p>{message}</p>
                <button id="cancel-edit" onClick={onCancel}>Cancel</button>
                <button id="confirm-edit" onClick={onConfirm}>Yes</button>
            </div>
        </div>
    );
}
