import { useState, useCallback } from 'react';
import { generateAppIdeas } from '../services/geminiService';

export const useAppIdeas = () => {
    const [appIdeas, setAppIdeas] = useState<string[] | null>(null);
    const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);
    const [appIdeasError, setAppIdeasError] = useState<string | null>(null);

    const getAppIdeas = useCallback(async (formulaName: string, explanation: string) => {
        setIsGeneratingIdeas(true);
        setAppIdeas(null);
        setAppIdeasError(null);
        try {
            const ideas = await generateAppIdeas(formulaName, explanation);
            setAppIdeas(ideas);
        } catch (e) {
            if (e instanceof Error) {
                setAppIdeasError(e.message);
            } else {
                setAppIdeasError('An unexpected error occurred while generating ideas.');
            }
        } finally {
            setIsGeneratingIdeas(false);
        }
    }, []);

    const clearAppIdeas = useCallback(() => {
        setAppIdeas(null);
        setAppIdeasError(null);
    }, []);

    return {
        appIdeas,
        isGeneratingIdeas,
        appIdeasError,
        getAppIdeas,
        clearAppIdeas
    };
};
