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
    // Initialize temporary state for editing, but don't rely on it for display in non-edit mode
    const [tempQuestionText, setTempQuestionText] = useState(data.label);
    const [tooltipText, setTooltipText] = useState(data.tooltip || '');
    const [tempTooltipText, setTempTooltipText] = useState(data.tooltip || '');

    // Removed useEffect that was causing cascading renders

    const handleQuestionDoubleClick = () => {
        setTempQuestionText(data.label);
        setIsEditingQuestion(true);
    };

    const handleQuestionBlur = () => {
        setIsEditingQuestion(false);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, label: tempQuestionText });
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
        setTempTooltipText(data.tooltip || '');
        setShowTooltipModal(true);
    };

    // Derived values for display

    return (
        <div
            className={`min-w-[250px] max-w-[300px] rounded-lg border-2 p-4 transition-all duration-200 relative ${selected
                ? 'bg-white border-blue-500 ring-4 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-blue-400/50'
                }`}
        >
            <Handle type="target" position={Position.Top} className="!bg-primary" />

            {/* Question text - editable on double click */}
            {isEditingQuestion ? (
                <textarea
                    value={tempQuestionText}
                    onChange={(e) => setTempQuestionText(e.target.value)}
                    onBlur={handleQuestionBlur}
                    autoFocus
                    className="w-full text-sm font-medium bg-background text-foreground rounded p-1 min-h-[40px] resize-y focus:outline-none"
                />
            ) : (
                <div
                    className="text-sm font-medium text-foreground mb-0 cursor-text pr-5"
                    onDoubleClick={handleQuestionDoubleClick}
                >
                    {data.label}
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
    const [tempOptionText, setTempOptionText] = useState(data.label);

    // Removed useEffect

    const handleDoubleClick = () => {
        setTempOptionText(data.label);
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, label: tempOptionText });
        }
    };

    return (
        <div className="w-[100px] h-[100px] flex items-center justify-center relative">
            {/* Diamond Shape Background */}
            <div
                className={`absolute w-[70px] h-[70px] transform rotate-45 transition-all duration-200 ${selected
                    ? 'bg-yellow-100 border-2 border-yellow-500 shadow-[0_0_0_4px_rgba(250,204,21,0.3)]'
                    : 'bg-yellow-50 border-2 border-yellow-400 hover:bg-yellow-100'
                    }`}
            />

            {/* Content */}
            <div className="z-10 relative w-full text-center">
                {isEditing ? (
                    <textarea
                        value={tempOptionText}
                        onChange={(e) => setTempOptionText(e.target.value)}
                        onBlur={handleBlur}
                        autoFocus
                        className="text-[10px] font-semibold text-center bg-background text-foreground border border-border rounded p-0.5 w-[90px] h-[40px] resize-none focus:outline-none"
                    />
                ) : (
                    <div
                        className="text-[10px] font-semibold text-secondary-foreground text-center px-1 cursor-text break-words max-w-[100px]"
                        onDoubleClick={handleDoubleClick}
                    >
                        {data.label}
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
    const [tempDocText, setTempDocText] = useState(data.label);
    const [tempDescriptionText, setTempDescriptionText] = useState(data.description || '');

    // Removed useEffect

    const handleLabelDoubleClick = () => {
        setTempDocText(data.label);
        setIsEditingLabel(true);
    };

    const handleLabelBlur = () => {
        setIsEditingLabel(false);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, label: tempDocText });
        }
    };

    const handleTypeClick = () => {
        const newType = (data.docType || 'optional') === 'mandatory' ? 'optional' : 'mandatory';
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, docType: newType });
        }
    };

    const handleDescriptionSave = () => {
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, description: tempDescriptionText });
        }
    };

    const openDescriptionModal = (e) => {
        e.stopPropagation();
        setTempDescriptionText(data.description || '');
        setShowDescriptionModal(true);
    };

    const docType = data.docType || 'optional';
    const isMandatory = docType === 'mandatory';
    const descriptionText = data.description || '';

    return (
        <div
            className={`min-w-[220px] max-w-[280px] p-3 rounded border-2 transition-all duration-200 relative ${isMandatory ? 'bg-blue-100' : 'bg-blue-50'
                } ${selected
                    ? 'border-blue-500 ring-4 ring-blue-500/20'
                    : `border-${isMandatory ? 'blue-500' : 'blue-300'} hover:border-blue-400`
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
                            value={tempDocText}
                            onChange={(e) => setTempDocText(e.target.value)}
                            onBlur={handleLabelBlur}
                            autoFocus
                            className="w-full text-[13px] font-semibold text-foreground bg-background/90 rounded p-1 min-h-[30px] resize-y focus:outline-none"
                        />
                    ) : (
                        <div
                            className="text-[13px] font-semibold text-foreground cursor-text pr-5"
                            onDoubleClick={handleLabelDoubleClick}
                        >
                            {data.label}
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

export const WaypointNode = memo(() => {
    return (
        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 border border-muted-foreground cursor-grab flex items-center justify-center translate-x-[-50%] translate-y-[-50%]">
        </div>
    );
});

export const EndNode = memo(({ data, id, selected }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempLabelText, setTempLabelText] = useState(data.label || 'End');

    // Remove useEffect

    const handleDoubleClick = () => {
        setTempLabelText(data.label || 'End');
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (data.onUpdate) {
            data.onUpdate(id, { ...data, label: tempLabelText });
        }
    };

    return (
        <div
            className={`w-[60px] h-[60px] rounded-full flex items-center justify-center relative transition-all duration-200 ${selected
                ? 'bg-red-100 border-2 border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.3)]'
                : 'bg-red-50 border-2 border-red-400'
                }`}
        >
            <Handle type="target" position={Position.Top} className="!bg-destructive" />

            <div className="z-10 relative w-full text-center">
                {isEditing ? (
                    <textarea
                        value={tempLabelText}
                        onChange={(e) => setTempLabelText(e.target.value)}
                        onBlur={handleBlur}
                        autoFocus
                        className="text-[10px] font-semibold text-center bg-background text-destructive-foreground border-none rounded p-0.5 w-[50px] h-[30px] resize-none overflow-hidden block mx-auto focus:outline-none"
                    />
                ) : (
                    <div
                        className="text-[10px] font-bold text-destructive cursor-text max-w-[50px] leading-tight mx-auto break-words"
                        onDoubleClick={handleDoubleClick}
                    >
                        {data.label || 'End'}
                    </div>
                )}
            </div>
        </div>
    );
});

