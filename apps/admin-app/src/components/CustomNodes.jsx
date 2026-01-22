import React, { useState, memo, useEffect } from 'react';
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

    useEffect(() => {
        setQuestionText(data.label);
        setTooltipText(data.tooltip || '');
        setTempTooltipText(data.tooltip || '');
    }, [data.label, data.tooltip]);

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
            className={`min-w-[250px] max-w-[300px] rounded-lg border-2 p-4 transition-all duration-200 relative ${selected
                    ? 'bg-primary/10 border-primary ring-4 ring-primary/20'
                    : 'bg-card border-border hover:border-primary/50'
                }`}
        >
            <Handle type="target" position={Position.Top} className="!bg-primary" />

            {/* Question text - editable on double click */}
            {isEditingQuestion ? (
                <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    onBlur={handleQuestionBlur}
                    autoFocus
                    className="w-full text-sm font-medium bg-background text-foreground rounded p-1 min-h-[40px] resize-y focus:outline-none"
                />
            ) : (
                <div
                    className="text-sm font-medium text-foreground mb-0 cursor-text pr-5"
                    onDoubleClick={handleQuestionDoubleClick}
                >
                    {questionText}
                </div>
            )}

            {/* Tooltip Icon - Visual Indicator (top-right) */}
            <div
                className={`absolute top-1 right-1 text-sm cursor-help ${tooltipText ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale'
                    }`}
                title={tooltipText ? "Has tooltip" : "No tooltip set"}
            >
                💡
            </div>

            {/* Tooltip Field */}
            <div className="mt-2.5 pt-2 border-t border-border text-xs min-h-[20px]">
                <div
                    onDoubleClick={openTooltipModal}
                    className={`cursor-pointer leading-tight ${tooltipText ? 'not-italic opacity-100 text-muted-foreground' : 'italic opacity-70 text-muted-foreground/50'
                        }`}
                    title="Double-click to edit tooltip"
                >
                    {truncateText(tooltipText || "Double-click to add tooltip...")}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-primary" />

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

    useEffect(() => {
        setOptionText(data.label);
    }, [data.label]);

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
        <div className="w-[100px] h-[100px] flex items-center justify-center relative">
            {/* Diamond Shape Background */}
            <div
                className={`absolute w-[70px] h-[70px] transform rotate-45 transition-all duration-200 ${selected
                        ? 'bg-secondary border-2 border-secondary-foreground shadow-[0_0_0_4px_rgba(var(--secondary),0.3)]'
                        : 'bg-secondary/50 border-2 border-secondary-foreground/50 hover:bg-secondary/80'
                    }`}
            />

            {/* Content */}
            <div className="z-10 relative w-full text-center">
                {isEditing ? (
                    <textarea
                        value={optionText}
                        onChange={(e) => setOptionText(e.target.value)}
                        onBlur={handleBlur}
                        autoFocus
                        className="text-[10px] font-semibold text-center bg-background text-foreground border border-border rounded p-0.5 w-[90px] h-[40px] resize-none focus:outline-none"
                    />
                ) : (
                    <div
                        className="text-[10px] font-semibold text-secondary-foreground text-center px-1 cursor-text break-words max-w-[100px]"
                        onDoubleClick={handleDoubleClick}
                    >
                        {optionText}
                    </div>
                )}
            </div>

            {/* Handles */}
            <Handle type="target" position={Position.Top} id="top" className="!bg-secondary-foreground !w-2 !h-2" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-secondary-foreground !w-2 !h-2" />
            <Handle type="source" position={Position.Left} id="left" className="!bg-secondary-foreground !w-2 !h-2" />
            <Handle type="source" position={Position.Right} id="right" className="!bg-secondary-foreground !w-2 !h-2" />
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

    useEffect(() => {
        setDocText(data.label);
        setDocType(data.docType || 'optional');
        setDescriptionText(data.description || '');
        setTempDescriptionText(data.description || '');
    }, [data.label, data.docType, data.description]);

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
        <div
            className={`min-w-[220px] max-w-[280px] p-3 rounded border-2 transition-all duration-200 relative ${isMandatory ? 'bg-accent/20' : 'bg-muted/20'
                } ${selected
                    ? 'border-accent ring-4 ring-accent/20'
                    : `border-${isMandatory ? 'accent' : 'muted-foreground/30'} hover:border-accent/70`
                }`}
        >
            <Handle type="target" position={Position.Right} className="!bg-accent-foreground" />

            <div
                className={`absolute top-1 right-1 text-sm cursor-help ${descriptionText ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale'
                    }`}
                title={descriptionText ? "Has description" : "No description set"}
            >
                📝
            </div>

            <div className="flex items-center gap-2">
                <span className="text-lg">📄</span>
                <div className="flex-1">
                    {/* Document label */}
                    {isEditingLabel ? (
                        <textarea
                            value={docText}
                            onChange={(e) => setDocText(e.target.value)}
                            onBlur={handleLabelBlur}
                            autoFocus
                            className="w-full text-[13px] font-semibold text-foreground bg-background/90 rounded p-1 min-h-[30px] resize-y focus:outline-none"
                        />
                    ) : (
                        <div
                            className="text-[13px] font-semibold text-foreground cursor-text pr-5"
                            onDoubleClick={handleLabelDoubleClick}
                        >
                            {docText}
                        </div>
                    )}

                    {/* Document type */}
                    <div
                        className={`text-[10px] uppercase mt-1 cursor-pointer select-none inline-block py-0.5 px-1.5 rounded text-white ${isMandatory ? 'bg-destructive' : 'bg-muted-foreground'
                            }`}
                        onClick={handleTypeClick}
                        title="Click to toggle between Mandatory/Optional"
                    >
                        {docType}
                    </div>
                </div>
            </div>

            {/* Description Field */}
            <div className="mt-2.5 pt-2 border-t border-border text-[11px] min-h-[18px]">
                <div
                    onDoubleClick={openDescriptionModal}
                    className={`cursor-pointer leading-tight ${descriptionText ? 'not-italic opacity-100 text-muted-foreground' : 'italic opacity-70 text-muted-foreground/50'
                        }`}
                    title="Double-click to edit description"
                >
                    {truncateText(descriptionText || "Double-click to add description...")}
                </div>
            </div>

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

export const WaypointNode = memo(({ data, isConnectable }) => {
    return (
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 border border-muted-foreground cursor-grab flex items-center justify-center translate-x-[-50%] translate-y-[-50%]">
        </div>
    );
});

export const EndNode = memo(({ data, id, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [labelText, setLabelText] = useState(data.label || 'End');

    useEffect(() => {
        setLabelText(data.label || 'End');
    }, [data.label]);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, label: labelText });
        }
    };

    return (
        <div
            className={`w-[60px] h-[60px] rounded-full flex items-center justify-center relative transition-all duration-200 ${selected
                    ? 'bg-destructive/20 border-2 border-destructive shadow-[0_0_0_4px_rgba(var(--destructive),0.3)]'
                    : 'bg-destructive/10 border-2 border-destructive/80'
                }`}
        >
            <Handle type="target" position={Position.Top} className="!bg-destructive" />

            <div className="z-10 relative w-full text-center">
                {isEditing ? (
                    <textarea
                        value={labelText}
                        onChange={(e) => setLabelText(e.target.value)}
                        onBlur={handleBlur}
                        autoFocus
                        className="text-[10px] font-semibold text-center bg-background text-destructive-foreground border-none rounded p-0.5 w-[50px] h-[30px] resize-none overflow-hidden block mx-auto focus:outline-none"
                    />
                ) : (
                    <div
                        className="text-[10px] font-bold text-destructive cursor-text max-w-[50px] leading-tight mx-auto break-words"
                        onDoubleClick={handleDoubleClick}
                    >
                        {labelText}
                    </div>
                )}
            </div>
        </div>
    );
});

