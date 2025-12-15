import { useState, useCallback } from 'react';
import { suggestNextStep, analyzeFormulaChain } from '../services/geminiService';
import type { FormulaResult, ChainedFormula } from '../types';

export const useFormulaChain = () => {
    const [formulaChain, setFormulaChain] = useState<ChainedFormula[]>([]);

    const [nextStepSuggestions, setNextStepSuggestions] = useState<string[] | null>(null);
    const [isSuggestingNextStep, setIsSuggestingNextStep] = useState<boolean>(false);
    const [nextStepError, setNextStepError] = useState<string | null>(null);

    const [isAnalyzingChain, setIsAnalyzingChain] = useState<boolean>(false);
    const [chainAnalysis, setChainAnalysis] = useState<string | null>(null);
    const [chainAnalysisError, setChainAnalysisError] = useState<string | null>(null);

    const clearSuggestionsAndAnalysis = () => {
        setNextStepSuggestions(null);
        setNextStepError(null);
        setChainAnalysis(null);
        setChainAnalysisError(null);
    };

    const addToChain = useCallback((formula: FormulaResult, result: string) => {
        const newChainItem: ChainedFormula = {
            id: `${Date.now()}-${Math.random()}`,
            formula,
            result,
        };
        setFormulaChain(prev => [...prev, newChainItem]);
        clearSuggestionsAndAnalysis();
    }, []);

    const removeFromChain = useCallback((id: string) => {
        setFormulaChain(prev => {
            const newChain = prev.filter(item => item.id !== id);
            if (newChain.length < prev.length) {
                clearSuggestionsAndAnalysis();
            }
            return newChain;
        });
    }, []);

    const suggest = useCallback(async () => {
        if (formulaChain.length === 0) return;

        setIsSuggestingNextStep(true);
        setNextStepSuggestions(null);
        setNextStepError(null);

        try {
            const lastStep = formulaChain[formulaChain.length - 1];
            const suggestions = await suggestNextStep(lastStep);
            setNextStepSuggestions(suggestions);
        } catch (e) {
            if (e instanceof Error) {
                setNextStepError(e.message);
            } else {
                setNextStepError('An unexpected error occurred while generating suggestions.');
            }
        } finally {
            setIsSuggestingNextStep(false);
        }
    }, [formulaChain]);
    
    const analyze = useCallback(async () => {
        if (formulaChain.length < 2) {
            setChainAnalysis(null);
            setChainAnalysisError("Analysis requires at least two steps in the chain.");
            return;
        };

        setIsAnalyzingChain(true);
        setChainAnalysis(null);
        setChainAnalysisError(null);

        try {
            const analysis = await analyzeFormulaChain(formulaChain);
            setChainAnalysis(analysis);
        } catch (e) {
            if (e instanceof Error) {
                setChainAnalysisError(e.message);
            } else {
                setChainAnalysisError('An unexpected error occurred during analysis.');
            }
        } finally {
            setIsAnalyzingChain(false);
        }
    }, [formulaChain]);

    const clearAnalysis = useCallback(() => {
        setChainAnalysis(null);
        setChainAnalysisError(null);
    }, []);

    return {
        chain: formulaChain,
        addToChain,
        removeFromChain,
        
        suggestions: nextStepSuggestions,
        isSuggesting: isSuggestingNextStep,
        suggestionError: nextStepError,
        suggestNextStep: suggest,

        analysis: chainAnalysis,
        isAnalyzing: isAnalyzingChain,
        analysisError: chainAnalysisError,
        analyzeChain: analyze,
        clearAnalysis,
    };
};
