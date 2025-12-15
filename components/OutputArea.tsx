

import React, { useState, useEffect } from 'react';
import type { FormulaResult, MultiFormulaProject, ChainedFormula } from '../types';
import CodeSnippet from './CodeSnippet';
import Sandbox from './Sandbox';

interface OutputAreaProps {
  project: MultiFormulaProject;
  onGetAppIdeas: (formulaName: string, explanation: string) => void;
  appIdeas: string[] | null;
  isGeneratingIdeas: boolean;
  appIdeasError: string | null;
  onAddToChain: (formula: FormulaResult, result: string) => void;
  chain: ChainedFormula[];
}

interface FormulaDetailsProps {
  formula: FormulaResult;
  onGetAppIdeas: (formulaName: string, explanation: string) => void;
  appIdeas: string[] | null;
  isGeneratingIdeas: boolean;
  appIdeasError: string | null;
  onAddToChain: (formula: FormulaResult, result: string) => void;
  chain: ChainedFormula[];
}


const FormulaDetails: React.FC<FormulaDetailsProps> = ({ formula, onGetAppIdeas, appIdeas, isGeneratingIdeas, appIdeasError, onAddToChain, chain }) => {
  type Language = 'javascript' | 'python' | 'java' | 'cpp';
  const [activeTab, setActiveTab] = useState<Language>('javascript');
  const [sandboxResult, setSandboxResult] = useState<string | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [isAddedToChain, setIsAddedToChain] = useState(false);

  useEffect(() => {
    // Reset states when a new formula is loaded
    setSandboxResult(null);
    setSandboxError(null);
    // Check if this formula instance is already in the chain
    const alreadyInChain = chain.some(item => item.formula.formulaName === formula.formulaName && item.formula.formulaString === formula.formulaString);
    setIsAddedToChain(alreadyInChain);
  }, [formula, chain]);

  const handleSandboxRun = (sResult: string | null, sError: string | null) => {
    setSandboxResult(sResult);
    setSandboxError(sError);
  };

  const handleAddToChainClick = () => {
    if (sandboxResult) {
      onAddToChain(formula, sandboxResult);
      setIsAddedToChain(true);
    }
  };

  const languageLabels: Record<Language, string> = {
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
  };

  const TabButton: React.FC<{ lang: Language; children: React.ReactNode }> = ({ lang, children }) => (
    <button
      onClick={() => setActiveTab(lang)}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        activeTab === lang
          ? 'bg-slate-800 text-cyan-400'
          : 'text-slate-400 hover:bg-slate-700/50'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-6">
       <div className="pb-4 border-b border-slate-700">
        <h2 className="text-3xl font-bold text-white">{formula.formulaName}</h2>
        {formula.role && <p className="text-md text-cyan-400 mt-1">{formula.role}</p>}
        <p className="mt-4 p-4 bg-slate-900/70 rounded-md text-xl font-mono text-cyan-300 text-center border border-slate-700">
          {formula.formulaString}
        </p>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-cyan-400 mb-2">Explanation</h3>
        <p className="text-slate-400 leading-relaxed">{formula.explanation}</p>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-cyan-400">Application Ideas</h3>
        <div className="flex items-center">
          <button
            onClick={() => onGetAppIdeas(formula.formulaName, formula.explanation)}
            disabled={isGeneratingIdeas}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingIdeas && (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isGeneratingIdeas ? 'Generating...' : '🚀 Get App Ideas'}
          </button>
          <button
            onClick={handleAddToChainClick}
            disabled={!sandboxResult || isAddedToChain}
            className="ml-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            title={!sandboxResult ? "Run the sandbox to get a result first" : (isAddedToChain ? "This formula has been added to the chain" : "Add formula and result to the chain")}
          >
            {isAddedToChain ? '✅ Added to Chain' : '🔗 Add to Formula Chain'}
          </button>
        </div>
        {appIdeasError && (
          <div className="p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-md text-sm">
            <p><strong className="font-semibold">Error:</strong> {appIdeasError}</p>
          </div>
        )}
        {appIdeas && appIdeas.length > 0 && (
          <div className="p-4 bg-slate-900/70 rounded-md border border-slate-700">
            <ul className="space-y-2 list-disc list-inside text-slate-400">
              {appIdeas.map((idea, index) => (
                <li key={index} className="leading-relaxed">{idea}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-cyan-400 mb-2">Parameters</h3>
        <ul className="space-y-2 list-disc list-inside text-slate-400">
          {formula.parameters.map((param) => (
            <li key={param.name}>
              <strong className="text-slate-300 font-mono">{param.name}:</strong> {param.description}
               {param.source && param.source.startsWith('formula:') && <span className="text-xs ml-2 text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded-full">from {param.source.split(':')[1].split('.')[0]}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-cyan-400 mb-2">Implementation Snippets</h3>
        <div className="border-b border-slate-700">
          {(Object.keys(languageLabels) as Language[]).map(lang => (
            <TabButton key={lang} lang={lang}>{languageLabels[lang]}</TabButton>
          ))}
        </div>
        <div className="pt-2">
          <CodeSnippet code={formula.codeSnippets[activeTab]} />
        </div>
      </div>
      <Sandbox
        parameters={formula.parameters}
        jsSnippet={formula.codeSnippets.javascript}
        onRun={handleSandboxRun}
        chain={chain}
      />
      {(sandboxResult || sandboxError) && (
        <div className="mt-4 p-4 bg-slate-800 rounded-md">
          <h4 className="text-lg font-medium text-slate-300 mb-2">Sandbox Output:</h4>
          {sandboxResult && <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">{sandboxResult}</pre>}
          {sandboxError && <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap">{sandboxError}</pre>}
        </div>
      )}
    </div>
  );
};


const OutputArea: React.FC<OutputAreaProps> = ({
  project,
  onGetAppIdeas,
  appIdeas,
  isGeneratingIdeas,
  appIdeasError,
  onAddToChain,
  chain
}) => {
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState(0);

  useEffect(() => {
    setSelectedFormulaIndex(0); // Reset to first formula when project changes
  }, [project]);

  const handleExportJson = () => {
    if (!project) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(project, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    // Sanitize project name for filename
    const fileName = `${project.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.download = fileName;
    link.click();
  };

  const selectedFormula = project.formulas[selectedFormulaIndex];
  
  if (!selectedFormula) {
    return (
        <div className="p-6 bg-yellow-900/50 text-yellow-300 border border-yellow-700 rounded-lg">
          <h3 className="font-bold">Project has no formulas</h3>
          <p>The generated project does not contain any formulas to display.</p>
        </div>
      );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-800/50 rounded-lg border border-slate-700 text-slate-300">
        <div className="mb-6 pb-4 border-b border-slate-700">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white tracking-wide">Project: {project.projectName}</h2>
                    <p className="mt-2 text-slate-400 leading-relaxed">{project.projectDescription}</p>
                </div>
                <button
                    onClick={handleExportJson}
                    className="ml-4 flex-shrink-0 inline-flex items-center justify-center px-3 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-colors"
                    title="Export project as JSON"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <aside className="md:col-span-1">
                <h3 className="text-xl font-semibold text-cyan-400 mb-3">Formulas</h3>
                <nav className="flex flex-col space-y-2">
                    {project.formulas.map((formula, index) => {
                        const dependencies = formula.parameters.filter(p => p.source && p.source.startsWith('formula:'));
                        const metDependencies = dependencies.every(dep => {
                            const sourceName = dep.source.split(':')[1].split('.')[0];
                            return chain.some(item => item.formula.formulaName === sourceName);
                        });
                        const isReady = dependencies.length === 0 || metDependencies;

                        return (
                            <button 
                                key={index}
                                onClick={() => setSelectedFormulaIndex(index)}
                                className={`p-3 text-left rounded-md transition-colors duration-200 w-full ${
                                    index === selectedFormulaIndex 
                                    ? 'bg-slate-700 shadow-md' 
                                    : 'bg-slate-900/50 hover:bg-slate-800/70'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 overflow-hidden">
                                        <span className={`block font-semibold truncate ${index === selectedFormulaIndex ? 'text-cyan-400' : 'text-slate-300'}`}>{formula.formulaName}</span>
                                        {formula.role && <span className="text-xs text-slate-500 truncate block">{formula.role}</span>}
                                    </div>
                                    {!isReady && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                            {/* FIX: Replaced invalid 'title' prop on SVG with a <title> child element for accessibility. */}
                                            <title>Dependencies not met</title>
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </nav>
            </aside>
            <main className="md:col-span-2">
                <FormulaDetails
                    formula={selectedFormula}
                    onGetAppIdeas={onGetAppIdeas}
                    appIdeas={appIdeas}
                    isGeneratingIdeas={isGeneratingIdeas}
                    appIdeasError={appIdeasError}
                    onAddToChain={onAddToChain}
                    chain={chain}
                />
            </main>
        </div>
    </div>
  );
};

export default OutputArea;
