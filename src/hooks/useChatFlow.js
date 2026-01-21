import { useState, useEffect, useRef } from 'react';
import { questionService } from '../services/xmlParser';
import { strapiService } from '../services/strapi';

export function useChatFlow() {
    const [history, setHistory] = useState([]); // Array of { type: 'question'|'answer', id, ... }
    const [currentQuestionId, setCurrentQuestionId] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]); // Array of { questionId, optionId }
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(true);
    const initializedRef = useRef(false);

    // Initial Data Load
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const init = async () => {
            try {
                // Critical: Questions must load
                await questionService.fetchQuestions();
            } catch (error) {
                console.error("Critical: Failed to load questions", error);
            }

            // Non-critical: Strapi (Tooltips/Docs)
            try {
                await Promise.allSettled([
                    strapiService.fetchTooltips(),
                    strapiService.fetchDocuments()
                ]);
            } catch (e) {
                console.warn("Strapi unreachable, continuing without tooltips.", e);
            }

            // Check for saved session
            const saved = localStorage.getItem('userAnswers');
            if (saved) {
                // Logic to resume...
            }

            // Start with first question
            addQuestionToHistory("1");
            setLoading(false);
        };

        init();
    }, []);

    const addQuestionToHistory = (id) => {
        const q = questionService.getQuestionById(id);
        if (!q) {
            console.error("Question not found:", id);
            return;
        }

        // Check for tooltip ID override
        let tooltipContent = null;
        if (q.tooltip) {
            const tooltipId = typeof q.tooltip === 'string' ? q.tooltip.trim() : null;
            if (tooltipId) {
                const rawContent = strapiService.getTooltip(tooltipId);
                if (rawContent) {
                    tooltipContent = strapiService.richTextToHtml(rawContent);
                }
            }
        }

        const message = {
            type: 'bot',
            id: q.id,
            text: q.text,
            tooltip: tooltipContent,
            options: q.options?.option || []
        };

        setHistory(prev => [...prev, message]);
        setCurrentQuestionId(id);
    };

    const handleAnswer = (optionId) => {
        const currentQ = questionService.getQuestionById(currentQuestionId);
        if (!currentQ) return;

        const selectedOption = currentQ.options.option.find(o => o.id == optionId);

        // Add user answer to history
        const answerMessage = {
            type: 'user',
            text: selectedOption ? selectedOption.text : optionId,
            questionId: currentQuestionId,
            optionId: optionId
        };

        setHistory(prev => [...prev, answerMessage]);

        const newAnswers = [...userAnswers, { questionId: currentQuestionId, optionId }];
        setUserAnswers(newAnswers);
        localStorage.setItem('userAnswers', JSON.stringify(newAnswers));

        // Determine next question
        let nextId = null;

        // 1. Check direct option mapping
        if (currentQ.nextQuestions && currentQ.nextQuestions.next) {
            const nexts = Array.isArray(currentQ.nextQuestions.next)
                ? currentQ.nextQuestions.next
                : [currentQ.nextQuestions.next];

            const match = nexts.find(n => n.optionId == optionId);
            if (match) {
                nextId = match.questionId;
            } else {
                // 2. Check default (no optionId)
                const def = nexts.find(n => !n.optionId);
                if (def) nextId = def.questionId;
            }
        }

        if (nextId) {
            // Add small delay for "thinking" effect? optional
            setTimeout(() => addQuestionToHistory(nextId), 300);
        } else {
            // End of flow
            setIsFinished(true);
        }
    };

    const resetChat = () => {
        setHistory([]);
        setUserAnswers([]);
        setIsFinished(false);
        localStorage.removeItem('userAnswers');
        // Reset init ref so we can start over? 
        // Or just manually call addQuestionToHistory("1")
        // No need to reset ref if we manually trigger start.
        addQuestionToHistory("1");
    };

    const goBack = () => {
        // Remove last answer and last question
        if (userAnswers.length === 0) return;

        const lastAnswer = userAnswers[userAnswers.length - 1];
        const newAnswers = userAnswers.slice(0, -1);
        setUserAnswers(newAnswers);
        localStorage.setItem('userAnswers', JSON.stringify(newAnswers));

        // Rebuild history? 
        // Easier to just slice history.
        // History pattern: Q1, A1, Q2, A2...
        // If we are at Q3 (waiting), history is Q1, A1, Q2, A2, Q3.
        // We want to go back to Q2 to re-answer.
        // So remove Q3 and A2.
        // Leaving Q1, A1, Q2.

        setHistory(prev => {
            // Find the index of the answer we are removing
            // It should be the last 'user' message
            const lastUserIndex = prev.findLastIndex(m => m.type === 'user');
            if (lastUserIndex === -1) return prev;

            // Remove everything after the answer before this one?
            // Actually, we want to remove the last Answer and the Question that followed it (if any).
            // But wait, if we are currently "waiting for answer", the last item is a Question.
            // If we answered, the last item is an Answer (and maybe next Question hasn't loaded yet?).
            // Usually: user sees Q3. deciding. Wants to change Q2.
            // So user clicks "Edit" on A2 bubble.

            return prev; // todo: implement robust history rewriting or just reset to that point
        });

        // For now, simpler "Edit" logic like in original:
        // "Editing this answer will remove all following answers and restart from this point."
        // So we need a function `rewindTo(questionId)`
    };

    const rewindTo = (questionId) => {
        // Find index in userAnswers
        const index = userAnswers.findIndex(a => a.questionId === questionId);
        if (index === -1) return;

        // Keep answers up to that point (exclusive? or inclusive and let them re-answer?)
        // Original logic: "slice(0, index)". So remove that answer and everything after.
        const newAnswers = userAnswers.slice(0, index);
        setUserAnswers(newAnswers);
        localStorage.setItem('userAnswers', JSON.stringify(newAnswers));

        // Re-calculate history
        // It's safer to rebuild history from scratch based on answers
        // But we can just clear history and replay?
        // Or just hard reset and fast-forward.

        const newHistory = [];
        // This is complex to do synchronously without `await`.
        // Better to trigger a re-eval effect.
        // For MVP:
        setHistory([]); // Flash clear
        // We need to replay. This might be tricky in a hook without async loop.
        // Alternative: Just set state "replaying" and use effect.

        // Let's modify logic: The component will handle the "Edit" click by calling this,
        // and we just reset to that Question ID.

        // Actually, if we clear history, we need to add Q1, then answer it, then Q2...
        // Ideally, we just persist `userAnswers` and derive `history` from it?
        // But `history` has async components (tooltips).

        // Simple approach:
        // 1. Update userAnswers.
        // 2. Set currentQuestionId to the one we want to answer.
        // 3. Rebuild history from remaining answers + currentQuestion.

        rebuildHistory(newAnswers, questionId);
    };

    const rebuildHistory = async (answers, targetQuestionId) => {
        // Clear current
        const builtHistory = [];
        let nextId = "1";

        for (const ans of answers) {
            const q = questionService.getQuestionById(nextId);
            if (!q) break;

            // Add Q
            builtHistory.push({
                type: 'bot',
                id: q.id,
                text: q.text,
                options: q.options?.option || []
            });

            // Add A
            const selected = q.options?.option?.find(o => o.id == ans.optionId);
            builtHistory.push({
                type: 'user',
                text: selected ? selected.text : ans.optionId,
                questionId: q.id,
                optionId: ans.optionId
            });

            // Find next
            if (q.nextQuestions && q.nextQuestions.next) {
                const nexts = Array.isArray(q.nextQuestions.next) ? q.nextQuestions.next : [q.nextQuestions.next];
                const match = nexts.find(n => n.optionId == ans.optionId) || nexts.find(n => !n.optionId);
                if (match) nextId = match.questionId;
            }
        }

        // Finally add the target question (which should be nextId)
        if (nextId === targetQuestionId) {
            const q = questionService.getQuestionById(nextId);
            if (q) {
                let tooltipContent = null;
                if (q.tooltip) {
                    const tooltipId = typeof q.tooltip === 'string' ? q.tooltip.trim() : null;
                    if (tooltipId) {
                        const raw = strapiService.getTooltip(tooltipId); // assume loaded
                        if (raw) tooltipContent = strapiService.richTextToHtml(raw);
                    }
                }

                builtHistory.push({
                    type: 'bot',
                    id: q.id,
                    text: q.text,
                    tooltip: tooltipContent,
                    options: q.options?.option || []
                });
                setCurrentQuestionId(nextId);
            }
        }

        setHistory(builtHistory);
        setIsFinished(false);
    };

    return {
        history,
        loading,
        handleAnswer,
        resetChat,
        rewindTo,
        isFinished,
        userAnswers
    };
}
