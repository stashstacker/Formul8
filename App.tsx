
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import InputArea from './components/InputArea';
import OutputArea from './components/OutputArea';
import Spinner from './components/Spinner';
import FormulaChain from './components/FormulaChain';
import { useFormulaForge } from './hooks/useFormulaForge';
import { useAppIdeas } from './hooks/useAppIdeas';
import { useFormulaChain } from './hooks/useFormulaChain';
import type { ChainedFormula, InputMode } from './types';

const App: React.FC = () => {
  // UI-specific state remains in the main component
  const [mode, setMode] = useState<InputMode>('problem');
  const [userInput, setUserInput] = useState<string>('');
  const [codeInput, setCodeInput] = useState<string>('');
  const [dataInput, setDataInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('1');

  // Custom hooks for modular, independent logic
  const { projectResult, isLoading, error, forge } = useFormulaForge();
  const { appIdeas, isGeneratingIdeas, appIdeasError, getAppIdeas, clearAppIdeas } = useAppIdeas();
  const { 
    chain, 
    addToChain, 
    removeFromChain,
    suggestions, 
    isSuggesting, 
    suggestionError, 
    suggestNextStep,
    analysis, 
    isAnalyzing, 
    analysisError, 
    analyzeChain, 
    clearAnalysis 
  } = useFormulaChain();

  const handleSubmit = useCallback(async () => {
    if (isLoading) return;
    if (mode === 'problem' && !userInput.trim()) return;
    if (mode === 'code' && !codeInput.trim()) return;
    if (mode === 'data' && !dataInput.trim()) return;

    // Coordinate state resets across different logical domains
    clearAppIdeas();
    
    const options = {
      chainContext: chain.length > 0 ? chain : undefined,
      inspire: false,
      dataInput: mode === 'data' ? dataInput : undefined
    };
    forge(mode, userInput, codeInput, difficulty, options);
    
  }, [userInput, codeInput, dataInput, mode, isLoading, chain, difficulty, forge, clearAppIdeas]);

  const handleInspire = useCallback(async () => {
    if (isLoading) return;
    
    clearAppIdeas();

    const options = {
      chainContext: chain.length > 0 ? chain : undefined,
      inspire: true,
      dataInput: mode === 'data' ? dataInput : undefined
    };
    forge(mode, userInput, codeInput, difficulty, options);
  }, [userInput, codeInput, dataInput, mode, isLoading, chain, difficulty, forge, clearAppIdeas]);


  const handleSuggestionClick = useCallback((suggestion: string) => {
      setMode('problem');
      setUserInput(suggestion);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const WelcomeMessage: React.FC = () => (
    <div className="p-6 text-center bg-slate-800/50 rounded-lg border border-slate-700 h-full flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-white">Welcome to FormulaForge</h2>
        <p className="mt-2 text-slate-400">
            Describe a complex problem, and the System Architect will forge a multi-formula project to solve it.
        </p>
        <div className="mt-6 text-left text-slate-400 bg-slate-900/70 p-4 rounded-md border border-slate-700">
            <h3 className="font-semibold text-slate-300 mb-2">Modes:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong className="text-cyan-400">Describe:</strong> Text to Formula</li>
                <li><strong className="text-cyan-400">Create:</strong> Concept to Formula</li>
                <li><strong className="text-cyan-400">Code 2 Math:</strong> Analyze existing code</li>
                <li><strong className="text-cyan-400">Data 2 Math:</strong> Reverse-engineer formulas from data</li>
            </ul>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="lg:sticky lg:top-6 flex flex-col gap-6">
            <InputArea
              mode={mode}
              setMode={setMode}
              userInput={userInput}
              setUserInput={setUserInput}
              codeInput={codeInput}
              setCodeInput={setCodeInput}
              handleSubmit={handleSubmit}
              handleInspire={handleInspire}
              isLoading={isLoading}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              dataInput={dataInput}
              setDataInput={setDataInput}
            />
            <FormulaChain 
                chain={chain} 
                onRemove={removeFromChain}
                onSuggestNextStep={suggestNextStep}
                suggestions={suggestions}
                isSuggesting={isSuggesting}
                suggestionError={suggestionError}
                onSuggestionClick={handleSuggestionClick}
                onAnalyzeChain={analyzeChain}
                isAnalyzingChain={isAnalyzing}
                chainAnalysis={analysis}
                chainAnalysisError={analysisError}
                onClearAnalysis={clearAnalysis}
            />
          </div>
          
          <div className="min-h-[60vh]">
            {isLoading && <Spinner />}
            {error && (
              <div className="p-6 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">
                <h3 className="font-bold">Generation Failed</h3>
                <p>{error}</p>
              </div>
            )}
            {projectResult && !isLoading && (
              <OutputArea 
                project={projectResult} 
                onGetAppIdeas={getAppIdeas}
                appIdeas={appIdeas}
                isGeneratingIdeas={isGeneratingIdeas}
                appIdeasError={appIdeasError}
                onAddToChain={addToChain}
                chain={chain}
              />
            )}
            {!isLoading && !error && !projectResult && <WelcomeMessage />}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
