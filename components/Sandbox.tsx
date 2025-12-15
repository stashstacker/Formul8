
import React, { useState, useEffect, useCallback } from 'react';
import type { FormulaParameter, ChainedFormula } from '../types';

interface SandboxProps {
  parameters: FormulaParameter[];
  jsSnippet: string;
  onRun: (result: string | null, error: string | null) => void;
  chain: ChainedFormula[];
}

const Sandbox: React.FC<SandboxProps> = ({ parameters, jsSnippet, onRun, chain }) => {
  const [paramValues, setParamValues] = useState<{ [key: string]: string }>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string | null }>({});

  const validateParameter = useCallback((value: string): string | null => {
    if (value.trim() === '') {
      return 'Value cannot be empty.';
    }
    if (!isFinite(Number(value))) {
      return 'Must be a valid number.';
    }
    return null;
  }, []);

  useEffect(() => {
    const initialValues: { [key: string]: string } = {};
    const initialErrors: { [key: string]: string | null } = {};

    parameters.forEach(param => {
        const isSourced = param.source && param.source.startsWith('formula:');
        if (isSourced) {
            const sourceFormulaName = param.source.split(':')[1].split('.')[0];
            const sourceItem = chain.find(item => item.formula.formulaName === sourceFormulaName);
            if (sourceItem) {
                try {
                    // Results are JSON strings, so parse them to get the raw value
                    const parsedResult = JSON.parse(sourceItem.result);
                    initialValues[param.name] = String(parsedResult);
                } catch {
                    initialValues[param.name] = sourceItem.result; // Fallback for non-JSON string
                }
                initialErrors[param.name] = null;
            } else {
                initialValues[param.name] = ''; // No value yet
                initialErrors[param.name] = `Run '${sourceFormulaName}' and add it to the chain first.`;
            }
        } else {
            const defaultValueStr = param.defaultValue.toString();
            initialValues[param.name] = defaultValueStr;
            initialErrors[param.name] = null; // Don't validate default values initially
        }
    });

    setParamValues(initialValues);
    setValidationErrors(initialErrors);
}, [parameters, chain]);
  
  const handleValueChange = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({
      ...prev,
      [name]: validateParameter(value)
    }));
  };

  const handleRun = useCallback(() => {
    onRun(null, null); // Clear previous results/errors in parent

    let hasErrors = false;
    const currentValidationErrors: { [key:string]: string | null } = {};
    parameters.forEach(param => {
        const value = paramValues[param.name] || '';
        const isSourced = param.source && param.source.startsWith('formula:');

        if (isSourced) {
            if (!value) {
                const sourceFormulaName = param.source.split(':')[1].split('.')[0];
                currentValidationErrors[param.name] = `Waiting for result from '${sourceFormulaName}'.`;
                hasErrors = true;
            }
        } else {
            const err = validateParameter(value);
            if (err) {
                currentValidationErrors[param.name] = err;
                hasErrors = true;
            }
        }
    });

    setValidationErrors(currentValidationErrors);

    if (hasErrors) {
      onRun(null, "Please resolve the errors in the parameters before running.");
      return;
    }

    try {
        const executableFunc = eval(jsSnippet);
        const args = parameters.map(p => {
            return parseFloat(paramValues[p.name]);
        });
        
        const output = executableFunc(...args);
        onRun(JSON.stringify(output, null, 2), null);

    } catch (e) {
        if (e instanceof Error) {
            onRun(null, e.message);
        } else {
            onRun(null, "An unknown execution error occurred.");
        }
    }
  }, [jsSnippet, parameters, paramValues, validateParameter, onRun, chain]);

  const hasValidationErrors = Object.values(validationErrors).some(v => v !== null);

  return (
    <div className="mt-6 p-4 bg-slate-900/70 border border-slate-700 rounded-lg">
      <h3 className="text-xl font-semibold text-cyan-400 mb-4">Interactive Sandbox</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {parameters.map(param => {
            const isSourced = param.source && param.source.startsWith('formula:');
            const error = validationErrors[param.name];
            
            if (isSourced) {
                const sourceFormulaName = param.source.split(':')[1].split('.')[0];
                return (
                    <div key={param.name}>
                        <label htmlFor={`param-${param.name}`} className="block text-sm font-medium text-slate-400 mb-1">
                          {param.name} <span className="text-slate-500">- from {sourceFormulaName}</span>
                        </label>
                        <div className={`w-full bg-slate-800 border rounded-md p-2 text-slate-300 min-h-[42px] flex items-center ${error ? 'border-yellow-500/50' : 'border-slate-600'}`}>
                           {paramValues[param.name] ? (
                                <span className="font-mono text-cyan-400">{paramValues[param.name]}</span>
                           ) : (
                                <span className="text-yellow-500 italic text-sm">Waiting for input...</span>
                           )}
                        </div>
                        {error && (
                          <p id={`param-error-${param.name}`} className="text-yellow-400 text-xs mt-1" role="alert">
                            {error}
                          </p>
                        )}
                    </div>
                );
            }

            return (
              <div key={param.name}>
                <label htmlFor={`param-${param.name}`} className="block text-sm font-medium text-slate-400 mb-1">
                  {param.name} <span className="text-slate-500">- {param.description}</span>
                </label>
                <input
                  type="text"
                  id={`param-${param.name}`}
                  value={paramValues[param.name] || ''}
                  onChange={(e) => handleValueChange(param.name, e.target.value)}
                  className={`w-full bg-slate-800 border rounded-md p-2 text-slate-300 focus:outline-none transition-colors ${
                    error
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-600 focus:ring-1 focus:ring-cyan-500'
                  }`}
                  aria-invalid={!!error}
                  aria-describedby={error ? `param-error-${param.name}` : undefined}
                />
                {error && (
                  <p id={`param-error-${param.name}`} className="text-red-400 text-xs mt-1" role="alert">
                    {error}
                  </p>
                )}
              </div>
            );
        })}
      </div>
      <button
        onClick={handleRun}
        disabled={hasValidationErrors}
        className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
      >
        Run
      </button>
    </div>
  );
};

export default Sandbox;