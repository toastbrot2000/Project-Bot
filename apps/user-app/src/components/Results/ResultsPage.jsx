import { useEffect, useState } from 'react';
import { questionService } from '../../services/xmlParser';
import { strapiService } from '../../services/strapi';

export function ResultsPage({ answers, onReset, onBack }) {
    const [mandatoryDocs, setMandatoryDocs] = useState([]);
    const [optionalDocs, setOptionalDocs] = useState([]);

    useEffect(() => {
        const dependencies = questionService.getDependencies();
        const mandatory = [];
        const optional = [];

        dependencies.forEach(doc => {

            const conditions = doc.conditions.condition || [];
            if (conditions.length === 0) return; // No conditions, maybe always default? or never?

            // Group by QID
            const groups = {};
            conditions.forEach(c => {
                if (!groups[c.questionId]) groups[c.questionId] = [];
                groups[c.questionId].push(c.optionId);
            });

            // Check if ALL groups are satisfied
            const allGroupsSatisfied = Object.keys(groups).every(qId => {
                // For this Question, did the user pick ONE of the allowed options?
                const userAns = answers.find(a => a.questionId == qId);
                if (!userAns) return false; // User didn't answer this question (maybe path skipped it)
                return groups[qId].includes(String(userAns.optionId)); // Options are strings often
            });

            if (allGroupsSatisfied) {
                // Fetch description from Strapi (if avaliable)
                // doc.text is the title.
                const desc = strapiService.getDocument(doc.text);
                const docWithDesc = { ...doc, description: desc };

                if (doc.type === 'mandatory') mandatory.push(docWithDesc);
                else optional.push(docWithDesc);
            }
        });

        setMandatoryDocs(mandatory);
        setOptionalDocs(optional);
    }, [answers]);

    return (
        <div id="results-page">
            <div className="results-content">
                <div id="recommendations-container" className="fade-in">
                    <h3>Recommended Visa</h3>
                    {/* Logic for visa recommendation could go here, for now focused on docs */}
                    <p>Based on your answers, here is your checklist:</p>
                </div>

                {mandatoryDocs.length > 0 && (
                    <div className="documents-section fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="documents-card">
                            <h2 className="card-header">Mandatory Documents</h2>
                            <div className="documents-container">
                                {mandatoryDocs.map((doc, idx) => (
                                    <div key={idx} className="document-item">
                                        <div className="doc-title">{doc.text}</div>
                                        {doc.description && (
                                            <div className="doc-description" dangerouslySetInnerHTML={{ __html: strapiService.richTextToHtml(doc.description) || doc.description }}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {optionalDocs.length > 0 && (
                    <div className="documents-section fade-in" style={{ animationDelay: '0.4s' }}>
                        <div className="documents-card">
                            <h2 className="card-header">Optional Documents</h2>
                            <div className="documents-container">
                                {optionalDocs.map((doc, idx) => (
                                    <div key={idx} className="document-item">
                                        <div className="doc-title">{doc.text}</div>
                                        {doc.description && (
                                            <div className="doc-description" dangerouslySetInnerHTML={{ __html: strapiService.richTextToHtml(doc.description) || doc.description }}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="results-actions fade-in" style={{ animationDelay: '0.6s' }}>
                    <button id="review-answers-button" className="material-button secondary" onClick={onBack}>
                        Go Back
                    </button>
                    <button id="restart-button" className="material-button" onClick={onReset}>
                        Start New Assessment
                    </button>
                </div>
            </div>
        </div>
    );
}
