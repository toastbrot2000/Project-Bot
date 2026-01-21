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
            // Check if ANY condition matches
            // Logic: A document is needed if ANY of its conditions is met?
            // Or if ALL?
            // Let's verify standard behavior. Usually it's "If Q1=A OR Q2=B".
            // But for things like "Student Visa", it might be complex.
            // Looking at XML: 
            // Uni Letter: Q1=1 AND Q2=1? (Studying AND Accepted)
            // No, XML structure:
            // <conditions> <condition ... /> <condition ... /> </conditions>
            // Usually implied OR unless specified.
            // Let's assume OR for now, or check typical simple XML logic.
            // Actually, for "University Acceptance Letter":
            // conditions: Q1=1, Q2=1. 
            // If it means OR, then "Working" people (Q1=2) who answered Q2=1 (Yes, confirmed offer) would get it?
            // If Q1=2 (Working), Q2=1 (Yes, confirmed offer) -> They need Employment Contract.
            // If Q1=1 (Studying), Q2=1 -> Uni Letter.
            // The file lists: 
            // Uni Letter: Q1=1, Q2=1. 
            // If it's OR, then anyone with Q2=1 gets Uni Letter? That's wrong. Working people don't need Uni letter.
            // So it must be AND?
            // Wait, multiple conditions in list usually implies AND in this specific schema?
            // "conditions" -> list of "condition".
            // Let's look at "Proof of Financial Means":
            // Q1=1 (Studying), Q1=2 (Working), Q1=4 (Exploring).
            // If AND: You must be Studying AND Working AND Exploring. Impossible.
            // So for Financial Means it MUST be OR.

            // Contradiction?
            // Uni Letter: Q1=1 (Studying) ... Q2=1 (Confirmed). 
            // Wait, Q2 is shared? 
            // Q1=1 -> Q2. Q1=2 -> Q2.
            // So if I am Studying (1) AND Confirmed (2->1).

            // Let's try to deduce from context.
            // Doc: "University Acceptance Letter"
            // Conditions: Q1=option1, Q2=option1.
            // Interpret as: REQUIRED IF (Q1 answered 1) AND (Q2 answered 1).

            // Doc: "Proof of Financial Means"
            // Conditions: Q1=1, Q1=2, Q1=4.
            // All refer to Q1.
            // REQUIRED IF (Q1 answered 1) OR (Q1 answered 2) OR (Q1 answered 4).

            // Heuristic:
            // Group conditions by Question ID?
            // If multiple conditions refer to DIFFERENT questions, it's AND.
            // If multiple conditions refer to SAME question, it's OR.
            // Ex: (Q1=1 OR Q1=2 OR Q1=4) AND (Q2=1 if present).

            // Let's implement this heuristic.

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
