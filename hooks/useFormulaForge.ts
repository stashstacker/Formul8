
import { useState, useCallback, useEffect } from 'react';
import { generateFormulaProject, inspireFormula, analyzeCode, reverseEngineerFormula } from '../services/geminiService';
import type { MultiFormulaProject, ChainedFormula, InputMode } from '../types';

const difficultyMap: { [key: string]: string } = {
    '1': 'Easy',
    '2': 'Medium',
    '3': 'Hard',
};

const PROJECT_STORAGE_KEY = 'formulaForge_lastProject';

export const useFormulaForge = () => {
    const [projectResult, setProjectResult] = useState<MultiFormulaProject | null>(() => {
        try {
            const saved = localStorage.getItem(PROJECT_STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to load project from localStorage", e);
            return null;
        }
    });
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (projectResult) {
            localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projectResult));
        }
    }, [projectResult]);

    const forge = useCallback(async (
        mode: InputMode, 
        userInput: string, 
        codeInput: string, 
        difficulty: string,
        options: { chainContext?: ChainedFormula[], inspire?: boolean, dataInput?: string } = {}
    ) => {
        const { chainContext, inspire = false, dataInput = '' } = options;
        setIsLoading(true);
        setError(null);
        setProjectResult(null);

        try {
            let result: MultiFormulaProject | null = null;
            if (mode === 'problem') {
                result = await generateFormulaProject(userInput, chainContext, inspire);
            } else if (mode === 'create') {
                const difficultyLabel = difficultyMap[difficulty];
                const singleResult = await inspireFormula(userInput, difficultyLabel, inspire);
                result = {
                  projectName: `Created Formula: ${singleResult.formulaName}`,
                  projectDescription: userInput.trim() 
                    ? `A formula concept inspired by "${userInput}" with ${difficultyLabel} difficulty.`
                    : `An inspired formula concept with ${difficultyLabel} difficulty.`,
                  formulas: [singleResult],
                };
            } else if (mode === 'code') {
                const singleResult = await analyzeCode(codeInput);
                result = {
                  projectName: `Code Analysis: ${singleResult.formulaName}`,
                  projectDescription: "The following formula was identified from the provided code snippet.",
                  formulas: [singleResult],
                };
            } else if (mode === 'data') {
                const singleResult = await reverseEngineerFormula(dataInput, userInput);
                result = {
                    projectName: `Data Discovery: ${singleResult.formulaName}`,
                    projectDescription: "This formula was reverse-engineered from the provided dataset.",
                    formulas: [singleResult],
                };
            }
            
            if (result) {
                setProjectResult(result);
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
