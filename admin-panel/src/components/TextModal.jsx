import React from 'react';
import ReactDOM from 'react-dom';

const TextModal = ({ isOpen, onClose, title, value, onChange, onSave, placeholder = "Enter text..." }) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
            }}
            onClick={handleOverlayClick}
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag events from reaching underlying elements
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#1f2937'
                    }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            padding: '4px',
                            lineHeight: '1'
                        }}
                        title="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Textarea */}
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoFocus
                    style={{
                        width: '100%',
                        minHeight: '300px',
                        padding: '12px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        marginBottom: '12px'
                    }}
                />

                {/* Character count */}
                <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '16px'
                }}>
                    {value.length} characters
                </div>

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            background: 'white',
                            color: '#374151',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSave();
                            onClose();
                        }}
                        style={{
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#3b82f6',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TextModal;
