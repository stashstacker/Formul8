import React from 'react';
import type { InputMode } from '../types';

interface InputAreaProps {
  mode: InputMode;
  setMode: (mode: InputMode) => void;
  userInput: string;
  setUserInput: (value: string) => void;
  codeInput: string;
  setCodeInput: (value: string) => void;
  handleSubmit: () => void;
  handleInspire: () => void;
  isLoading: boolean;
  difficulty: string;
  setDifficulty: (value: string) => void;
  dataInput: string;
  setDataInput: (value: string) => void;
}

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold leading-5 rounded-t-md focus:outline-none transition-colors duration-300 ${
      active
        ? 'text-cyan-400 border-b-2 border-cyan-400'
        : 'text-slate-400 hover:text-white hover:bg-white/[0.12]'
    }`}
    aria-selected={active}
    role="tab"
  >
    {children}
  </button>
);


const InputArea: React.FC<InputAreaProps> = ({
  mode,
  setMode,
  userInput,
  setUserInput,
  codeInput,
  setCodeInput,
  handleSubmit,
  handleInspire,
  isLoading,
  difficulty,
  setDifficulty,
  dataInput,
  setDataInput
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleSubmit();
    }
  };

  const difficultyMap: { [key: string]: string } = {
    '1': 'Easy',
    '2': 'Medium',
    '3': 'Hard',
  };

  const isSubmitDisabled = isLoading || 
    (mode === 'problem' && !userInput.trim()) || 
    (mode === 'code' && !codeInput.trim()) ||
    (mode === 'data' && !dataInput.trim());
    
  const isInspireDisabled = isLoading || mode === 'code' || mode === 'data';
  
  const submitButtonText: Record<InputMode, string> = {
    problem: 'Forge Project',
    create: 'Create Formula',
    code: 'Analyze Code',
    data: 'Find Pattern'
  };

  const loadExampleData = () => {
      const example = `x, y, result
1, 1, 2
2, 2, 4
3, 3, 6
4, 4, 8
5, 5, 10`;
      setDataInput(example);
      setUserInput('Simple linear relationship'); // Context hint
  };

  return (
    <div className="p-4 md:p-6 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex border-b border-slate-700" role="tablist">
        <TabButton active={mode === 'problem'} onClick={() => setMode('problem')}>Describe</TabButton>
        <TabButton active={mode === 'create'} onClick={() => setMode('create')}>Create</TabButton>
        <TabButton active={mode === 'code'} onClick={() => setMode('code')}>Code 2 Math</TabButton>
        <TabButton active={mode === 'data'} onClick={() => setMode('data')}>Data 2 Math</TabButton>
      </div>

      <div className="mt-4 space-y-4">
        {mode === 'problem' && (
           <div>
            <label htmlFor="problem-description" className="block text-lg font-semibold text-slate-300 mb-2">
              Problem or System Description
            </label>
            <textarea
              id="problem-description"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 'create a basic physics simulation for a bouncing ball' or 'model a simple supply chain system'"
              className="w-full h-40 p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none transition-colors"
              disabled={isLoading}
              aria-label="Problem Description Input"
            />
          </div>
        )}
        {mode === 'create' && (
          <>
            <div>
              <label htmlFor="formula-idea" className="block text-lg font-semibold text-slate-300 mb-2">
                Formula Topic or Idea
              </label>
              <textarea
                id="formula-idea"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 'a formula for rocket thrust', 'an algorithm for a basic recommendation engine'. Leave blank for a random idea."
                className="w-full h-40 p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none transition-colors"
                disabled={isLoading}
                aria-label="Formula Idea Input"
              />
            </div>
             <div>
              <label htmlFor="difficulty-slider" className="block text-sm font-medium text-slate-400 mb-2">
                Creative Difficulty: <span className="font-bold text-cyan-400">{difficultyMap[difficulty]}</span>
              </label>
              <input
                id="difficulty-slider"
                type="range"
                min="1"
                max="3"
                step="1"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isLoading}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </>
        )}
        {mode === 'code' && (
          <div>
            <label htmlFor="code-description" className="block text-lg font-semibold text-slate-300 mb-2">
              Code Snippet
            </label>
            <textarea
              id="code-description"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`// Paste your code snippet here to identify the underlying formula...\n\nfunction calculate(n) {\n  let sum = 0;\n  for (let i = 1; i <= n; i++) {\n    sum += i;\n  }\n  return sum;\n}`}
              className="w-full h-40 p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-300 font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none transition-colors"
              disabled={isLoading}
              aria-label="Code Analysis Input"
            />
          </div>
        )}
        {mode === 'data' && (
           <>
            <div>
              <div className="flex justify-between items-center mb-2">
                  <label htmlFor="data-input" className="block text-lg font-semibold text-slate-300">
                    Data Points (CSV)
                  </label>
                  <button onClick={loadExampleData} className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline">
                      Load Example
                  </button>
              </div>
              <textarea
                id="data-input"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`x, y, result\n1, 2, 5\n2, 3, 13\n...`}
                className="w-full h-32 p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-300 font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none transition-colors"
                disabled={isLoading}
                aria-label="CSV Data Input"
              />
            </div>
             <div>
              <label htmlFor="data-context" className="block text-sm font-semibold text-slate-300 mb-2">
                Context / Hint (Optional)
              </label>
              <input
                type="text"
                id="data-context"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 'Rocket velocity' or 'Sales trends'"
                className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                disabled={isLoading}
              />
            </div>
           </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="flex-grow bg-cyan-600 text-white font-bold py-3 px-4 rounded-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {mode === 'data' ? 'Analyzing Data...' : 'Architecting...'}
            </>
          ) : (
            submitButtonText[mode]
          )}
        </button>
        <button
          onClick={handleInspire}
          disabled={isInspireDisabled}
          className={`flex-shrink-0 font-bold py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center ${
              isInspireDisabled ? 'bg-slate-600 cursor-not-allowed text-white' : 'bg-purple-600 text-white hover:bg-purple-500'
          }`}
          title={isInspireDisabled ? "Inspiration available for Problem/Create modes only" : "Flesh out your idea with AI"}
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.618H2.5a1.5 1.5 0 00-1.06.44L.44 6.06A1.5 1.5 0 000 7.122V12.5A1.5 1.5 0 001.5 14H3v1.5A1.5 1.5 0 004.5 17h5a1.5 1.5 0 001.5-1.5V14h1.5a1.5 1.5 0 001.5-1.5V7.122a1.5 1.5 0 00-.44-1.062l-1-1a1.5 1.5 0 00-1.062-.44H11V3a1 1 0 10-2 0v1H6V3a1 1 0 00-1-1zm6 8.5a1.5 1.5 0 00-1.5-1.5h-3A1.5 1.5 0 005 10.5v1A1.5 1.5 0 006.5 13h3A1.5 1.5 0 0011 11.5v-1z" clipRule="evenodd" />
            <path d="M15.25 1a1.25 1.25 0 00-1.25 1.25v.25h-1.25a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V5.25h1.25a.75.75 0 000-1.5H16.5V2.5A1.25 1.25 0 0015.25 1zM18.75 5a.75.75 0 00-.75.75v1.25h-1.25a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V8.5h1.25a.75.75 0 000-1.5H19.5V5.75a.75.75 0 00-.75-.75z" />
          </svg>
          <span className="ml-2 hidden sm:inline">Inspire Me</span>
        </button>
      </div>
       <p className="text-xs text-slate-500 mt-2 text-center">Pro Tip: Use Cmd/Ctrl + Enter to submit.</p>
    </div>
  );
};

export default InputArea;