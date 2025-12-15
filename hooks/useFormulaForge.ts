import { useState, useCallback } from 'react';
import { generateFormulaProject, inspireFormula, analyzeCode } from '../services/geminiService';
import type { MultiFormulaProject, ChainedFormula } from '../types';

type InputMode = 'problem' | 'create' | 'code';
const difficultyMap: { [key: string]: string } = {
    '1': 'Easy',
    '2': 'Medium',
    '3': 'Hard',
};

export const useFormulaForge = () => {
    const [projectResult, setProjectResult] = useState<MultiFormulaProject | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const forge = useCallback(async (
        mode: InputMode, 
        userInput: string, 
        codeInput: string, 
        difficulty: string,
        options: { chainContext?: ChainedFormula[], inspire?: boolean } = {}
    ) => {
        const { chainContext, inspire = false } = options;
        setIsLoading(true);
        setError(null);
        setProjectResult(null);

        try {
            if (mode === 'problem') {
                const result = await generateFormulaProject(userInput, chainContext, inspire);
                setProjectResult(result);
            } else if (mode === 'create') {
                const difficultyLabel = difficultyMap[difficulty];
                const result = await inspireFormula(userInput, difficultyLabel, inspire);
                setProjectResult({
                  projectName: `Created Formula: ${result.formulaName}`,
                  projectDescription: userInput.trim() 
                    ? `A formula concept inspired by "${userInput}" with ${difficultyLabel} difficulty.`
                    : `An inspired formula concept with ${difficultyLabel} difficulty.`,
                  formulas: [result],
                });
            } else { // mode === 'code'
                const result = await analyzeCode(codeInput);
                setProjectResult({
                  projectName: `Code Analysis: ${result.formulaName}`,
                  projectDescription: "The following formula was identified from the provided code snippet.",
                  formulas: [result],
                });
            }
        } catch (e) {
            if (e instanceof Error) {
                setError(`Error: ${e.message}`);
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { projectResult, isLoading, error, forge };
};