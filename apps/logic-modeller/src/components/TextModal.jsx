import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import MDEditor from '@uiw/react-md-editor';
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const TextModal = ({ isOpen, onClose, title, value, onChange, onSave, placeholder = "Enter text..." }) => {
    const initialValueRef = useRef(value);

    // Sync initial value when modal opens
    useEffect(() => {
        if (isOpen) {
            initialValueRef.current = value;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCloseRequest = () => {
        if (value !== initialValueRef.current) {
            if (window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div
            className="text-modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                animation: 'fadeIn 0.2s ease-out'
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .wmde-markdown {
                    background-color: transparent !important;
                    font-family: inherit !important;
                }
                .w-md-editor {
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 12px !important;
                    box-shadow: none !important;
                    background: #f8fafc !important;
                    overflow: hidden;
                }
                .w-md-editor-toolbar {
                    background: #f1f5f9 !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 8px !important;
                }
                .w-md-editor-content {
                    background: #f8fafc !important;
                }
                .w-md-editor-text-input {
                     font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                }
                .w-md-editor-preview {
                    background: white !important;
                    box-shadow: inset 1px 0 0 0 #e2e8f0 !important;
                }
                `}
            </style>
            <div
                className="text-modal-content"
                style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.5)',
                    borderRadius: '24px',
                    padding: '32px',
                    maxWidth: '900px',
                    width: '95%',
                    height: '85vh',
                    maxHeight: '850px',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <div>
                        <h3 style={{
                            margin: 0,
                            fontSize: '22px',
                            fontWeight: '700',
                            color: '#0f172a',
                            letterSpacing: '-0.025em'
                        }}>
                            {title}
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                            Rich text editor with Markdown support
                        </p>
                    </div>
                    <button
                        onClick={handleCloseRequest}
                        style={{
                            background: 'rgba(241, 245, 249, 1)',
                            border: 'none',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#64748b',
                            transition: 'all 0.2s'
                        }}
                        title="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Editor Area */}
                <div style={{ flex: 1, minHeight: 0, marginBottom: '20px' }} data-color-mode="light">
                    <MDEditor
                        value={value}
                        onChange={onChange}
                        preview="live"
                        height="100%"
                        style={{ height: '100%' }}
                        textareaProps={{
                            placeholder: placeholder
                        }}
                    />
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9'
                }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#94a3b8'
                    }}>
                        {value.length} characters
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px'
                    }}>
                        <button
                            onClick={handleCloseRequest}
                            style={{
                                padding: '10px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                background: 'white',
                                color: '#475569',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Discard
                        </button>
                        <button
                            onClick={() => {
                                onSave();
                                onClose();
                            }}
                            style={{
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                border: 'none',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: 'white',
                                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TextModal;


