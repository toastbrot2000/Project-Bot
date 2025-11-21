import React, { useState, memo } from 'react';
import { Handle, Position } from 'reactflow';
import TextModal from './TextModal';

// Helper function to truncate text to 2 lines (~80 characters)
const truncateText = (text, maxLength = 80) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

export const QuestionNode = memo(({ data, id, selected }) => {
    const [isEditingQuestion, setIsEditingQuestion] = useState(false);
    const [showTooltipModal, setShowTooltipModal] = useState(false);
    const [questionText, setQuestionText] = useState(data.label);
    const [tooltipText, setTooltipText] = useState(data.tooltip || '');
    const [tempTooltipText, setTempTooltipText] = useState(data.tooltip || '');

    const handleQuestionDoubleClick = () => {
        setIsEditingQuestion(true);
    };

    const handleQuestionBlur = () => {
        setIsEditingQuestion(false);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, label: questionText });
        }
    };

    const handleTooltipSave = () => {
        setTooltipText(tempTooltipText);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, tooltip: tempTooltipText });
        }
    };

    const openTooltipModal = (e) => {
        e.stopPropagation();
        setTempTooltipText(tooltipText);
        setShowTooltipModal(true);
    };

    return (
        <div
            style={{
                padding: '15px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: selected ? '2px solid #f59e0b' : '2px solid #5a67d8',
                minWidth: '250px',
                maxWidth: '300px',
                boxShadow: selected ? '0 0 0 4px rgba(245, 158, 11, 0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
                position: 'relative',
                transition: 'all 0.2s ease'
            }}
        >
            <Handle type="target" position={Position.Top} />

            {/* Question text - editable on double click */}
            {isEditingQuestion ? (
                <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    onBlur={handleQuestionBlur}
                    autoFocus
                    style={{
                        width: '100%',
                        fontSize: '14px',
                        fontWeight: '500',
                        background: 'rgba(255,255,255,0.9)',
                        color: '#1f2937',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px',
                        resize: 'vertical',
                        minHeight: '40px'
                    }}
                />
            ) : (
                <div
                    style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '0',
                        cursor: 'text',
                        paddingRight: '20px'
                    }}
                    onDoubleClick={handleQuestionDoubleClick}
                >
                    {questionText}
                </div>
            )}

            {/* Tooltip Icon - Visual Indicator (top-right) */}
            <div
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    opacity: tooltipText ? 1 : 0.3,
                    filter: tooltipText ? 'none' : 'grayscale(100%)',
                    fontSize: '14px',
                    cursor: 'help'
                }}
                title={tooltipText ? "Has tooltip" : "No tooltip set"}
            >
                💡
            </div>

            {/* Tooltip Field - Bottom of node (truncated, opens modal on double-click) */}
            <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255,255,255,0.3)',
                fontSize: '12px',
                minHeight: '20px'
            }}>
                <div
                    onDoubleClick={openTooltipModal}
                    style={{
                        cursor: 'pointer',
                        fontStyle: tooltipText ? 'normal' : 'italic',
                        opacity: tooltipText ? 1 : 0.7,
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: '1.4'
                    }}
                    title="Double-click to edit tooltip"
                >
                    {truncateText(tooltipText || "Double-click to add tooltip...")}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} />

            {/* Tooltip Modal */}
            <TextModal
                isOpen={showTooltipModal}
                onClose={() => setShowTooltipModal(false)}
                title="Edit Tooltip"
                value={tempTooltipText}
                onChange={setTempTooltipText}
                onSave={handleTooltipSave}
                placeholder="Enter tooltip text (can be multiple pages)..."
            />
        </div>
    );
});

export const OptionNode = memo(({ data, id, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [optionText, setOptionText] = useState(data.label);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, label: optionText });
        }
    };

    return (
        <div style={{
            width: '100px',
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {/* Diamond Shape Background */}
            <div style={{
                position: 'absolute',
                width: '70px',
                height: '70px',
                background: '#fef3c7',
                border: selected ? '2px solid #2563eb' : '2px solid #d97706',
                transform: 'rotate(45deg)',
                boxShadow: selected ? '0 0 0 4px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 0,
                transition: 'all 0.2s ease'
            }} />

            {/* Content */}
            <div style={{ zIndex: 1, position: 'relative', width: '100%', textAlign: 'center' }}>
                {isEditing ? (
                    <textarea
                        value={optionText}
                        onChange={(e) => setOptionText(e.target.value)}
                        onBlur={handleBlur}
                        autoFocus
                        style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.9)',
                            color: '#1f2937',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '2px',
                            width: '90px',
                            height: '40px',
                            resize: 'none'
                        }}
                    />
                ) : (
                    <div
                        style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: '#92400e',
                            textAlign: 'center',
                            padding: '0 5px',
                            cursor: 'text',
                            wordWrap: 'break-word',
                            maxWidth: '100px'
                        }}
                        onDoubleClick={handleDoubleClick}
                    >
                        {optionText}
                    </div>
                )}
            </div>

            {/* Handles at ALL corners of the diamond */}
            <Handle
                type="target"
                position={Position.Top}
                id="top"
                style={{ top: '0px', background: '#d97706', zIndex: 2 }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom"
                style={{ bottom: '0px', background: '#d97706', zIndex: 2 }}
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left"
                style={{ left: '0px', background: '#d97706', zIndex: 2 }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                style={{ right: '0px', background: '#d97706', zIndex: 2 }}
            />
        </div>
    );
});

export const DocumentNode = memo(({ data, id, selected }) => {
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [docText, setDocText] = useState(data.label);
    const [docType, setDocType] = useState(data.docType || 'optional');
    const [descriptionText, setDescriptionText] = useState(data.description || '');
    const [tempDescriptionText, setTempDescriptionText] = useState(data.description || '');

    const handleLabelDoubleClick = () => {
        setIsEditingLabel(true);
    };

    const handleLabelBlur = () => {
        setIsEditingLabel(false);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, label: docText });
        }
    };

    const handleTypeClick = () => {
        const newType = docType === 'mandatory' ? 'optional' : 'mandatory';
        setDocType(newType);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, docType: newType });
        }
    };

    const handleDescriptionSave = () => {
        setDescriptionText(tempDescriptionText);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, description: tempDescriptionText });
        }
    };

    const openDescriptionModal = (e) => {
        e.stopPropagation();
        setTempDescriptionText(descriptionText);
        setShowDescriptionModal(true);
    };

    const isMandatory = docType === 'mandatory';

    return (
        <div style={{
            padding: '12px 18px',
            background: isMandatory ? '#dbeafe' : '#e0f2fe',
            border: selected ? '2px solid #2563eb' : `2px solid ${isMandatory ? '#2563eb' : '#0ea5e9'}`,
            borderRadius: '4px',
            minWidth: '220px',
            maxWidth: '280px',
            boxShadow: selected ? '0 0 0 4px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
            position: 'relative',
            transition: 'all 0.2s ease'
        }}>
            {/* Connection Handle on the RIGHT side */}
            <Handle type="target" position={Position.Right} style={{ background: '#2563eb' }} />

            {/* Description Icon - Visual Indicator (top-right) */}
            <div
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    opacity: descriptionText ? 1 : 0.3,
                    filter: descriptionText ? 'none' : 'grayscale(100%)',
                    fontSize: '14px',
                    cursor: 'help'
                }}
                title={descriptionText ? "Has description" : "No description set"}
            >
                📝
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📄</span>
                <div style={{ flex: 1 }}>
                    {/* Document label - editable */}
                    {isEditingLabel ? (
                        <textarea
                            value={docText}
                            onChange={(e) => setDocText(e.target.value)}
                            onBlur={handleLabelBlur}
                            autoFocus
                            style={{
                                width: '100%',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#1e40af',
                                background: 'rgba(255,255,255,0.9)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px',
                                resize: 'vertical',
                                minHeight: '30px'
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                fontWeight: '600',
                                color: '#1e40af',
                                fontSize: '13px',
                                cursor: 'text',
                                paddingRight: '20px'
                            }}
                            onDoubleClick={handleLabelDoubleClick}
                        >
                            {docText}
                        </div>
                    )}

                    {/* Document type - clickable to toggle */}
                    <div
                        style={{
                            fontSize: '10px',
                            color: '#3730a3',
                            textTransform: 'uppercase',
                            marginTop: '4px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            display: 'inline-block',
                            padding: '2px 6px',
                            background: isMandatory ? '#2563eb' : '#0ea5e9',
                            color: 'white',
                            borderRadius: '3px'
                        }}
                        onClick={handleTypeClick}
                        title="Click to toggle between Mandatory/Optional"
                    >
                        {docType}
                    </div>
                </div>
            </div>

            {/* Description Field - Bottom of node (truncated, opens modal on double-click) */}
            <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '11px',
                minHeight: '18px'
            }}>
                <div
                    onDoubleClick={openDescriptionModal}
                    style={{
                        cursor: 'pointer',
                        fontStyle: descriptionText ? 'normal' : 'italic',
                        opacity: descriptionText ? 1 : 0.7,
                        color: '#1e40af',
                        lineHeight: '1.4'
                    }}
                    title="Double-click to edit description"
                >
                    {truncateText(descriptionText || "Double-click to add description...")}
                </div>
            </div>

            {/* Description Modal */}
            <TextModal
                isOpen={showDescriptionModal}
                onClose={() => setShowDescriptionModal(false)}
                title="Edit Document Description"
                value={tempDescriptionText}
                onChange={setTempDescriptionText}
                onSave={handleDescriptionSave}
                placeholder="Enter document description (requirements, details, etc.)..."
            />
        </div>
    );
});

// Waypoint Node for Edge Routing
export const WaypointNode = memo(({ data, isConnectable }) => {
    return (
        <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: '#6b7280',
            border: '2px solid white',
            boxShadow: '0 0 0 1px #6b7280',
            cursor: 'grab',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
        }}>
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                style={{ opacity: 0, width: '100%', height: '100%', left: 0, top: 0, border: 'none', background: 'transparent' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                style={{ opacity: 0, width: '100%', height: '100%', left: 0, top: 0, border: 'none', background: 'transparent' }}
            />
        </div>
    );
});
