
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { FormulaParameter, ChainedFormula } from '../types';

interface SandboxProps {
  parameters: FormulaParameter[];
  jsSnippet: string;
  onRun: (result: string | null, error: string | null) => void;
  chain: ChainedFormula[];
}

interface PlotPoint {
  x: number;
  y: number;
}

const Sandbox: React.FC<SandboxProps> = ({ parameters, jsSnippet, onRun, chain }) => {
  const [paramValues, setParamValues] = useState<{ [key: string]: string }>({});
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string | null }>({});
  
  // Visualization State
  const [showGraph, setShowGraph] = useState(false);
  const [xParam, setXParam] = useState<string>('');
  const [rangeStart, setRangeStart] = useState<string>('0');
  const [rangeEnd, setRangeEnd] = useState<string>('100');
  const [steps, setSteps] = useState<string>('50');
  const [plotData, setPlotData] = useState<PlotPoint[]>([]);
  const [plotError, setPlotError] = useState<string | null>(null);

  const numericParams = useMemo(() => parameters.filter(p => !p.source?.startsWith('formula:')), [parameters]);

  useEffect(() => {
    if (numericParams.length > 0 && !xParam) {
        setXParam(numericParams[0].name);
    }
  }, [numericParams, xParam]);

  const validateParameter = useCallback((value: string): string | null => {
    if (value.trim() === '') {
      return 'Value cannot be empty.';
    }
    if (!isFinite(Number(value))) {
      return 'Must be a valid number.';
    }
    return null;
  }, []);

  const getSourceFormulaName = (sourceStr: string): string | null => {
      // Robustly parse "formula:FormulaName.output"
      if (!sourceStr || !sourceStr.startsWith('formula:')) return null;
      try {
          const parts = sourceStr.split(':');
          if (parts.length < 2) return null;
          // Split by dot to remove .output, but trim to be safe
          const namePart = parts[1].split('.')[0].trim();
          return namePart;
      } catch (e) {
          return null;
      }
  };

  useEffect(() => {
    const initialValues: { [key: string]: string } = {};
    const initialErrors: { [key: string]: string | null } = {};

    parameters.forEach(param => {
        const sourceFormulaName = param.source ? getSourceFormulaName(param.source) : null;
        
        if (sourceFormulaName) {
            // Case-insensitive matching for robustness
            const sourceItem = chain.find(item => 
                item.formula.formulaName.toLowerCase() === sourceFormulaName.toLowerCase()
            );

            if (sourceItem) {
                try {
                    // Try to parse as JSON first (if it's a complex object), otherwise use raw string
                    // But for the sandbox inputs, we primarily want numbers.
                    const parsedResult = JSON.parse(sourceItem.result);
                    initialValues[param.name] = String(parsedResult);
                } catch {
                    initialValues[param.name] = sourceItem.result;
                }
                initialErrors[param.name] = null;
            } else {
                initialValues[param.name] = '';
                initialErrors[param.name] = `Run '${sourceFormulaName}' first.`;
            }
        } else {
            const defaultValueStr = param.defaultValue.toString();
            initialValues[param.name] = defaultValueStr;
            initialErrors[param.name] = null;
        }
    });

    setParamValues(initialValues);
    setValidationErrors(initialErrors);
    
    // Reset graph when formula changes
    setPlotData([]);
    setShowGraph(false);
    setPlotError(null);
}, [parameters, chain]);
  
  const handleValueChange = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
    setValidationErrors(prev => ({
      ...prev,
      [name]: validateParameter(value)
    }));
  };

  const executeFormula = (values: { [key: string]: string }): any => {
     // Check for basic validation before execution
     parameters.forEach(param => {
         const val = values[param.name];
         if (!val || !isFinite(Number(val))) {
             throw new Error(`Invalid value for ${param.name}`);
         }
     });

     // Use Function constructor instead of eval for safer execution scope
     // jsSnippet is expected to be an arrow function or function expression: "(a, b) => a + b"
     // We construct: return ((a,b) => a+b)(...args)
     
     // Note: we can't easily name the arguments in the Function constructor because jsSnippet is already a function definition.
     // So we simply return the evaluated snippet applied to the arguments.
     
     try {
         const paramNames = parameters.map(p => p.name);
         const paramValuesFloat = paramNames.map(name => parseFloat(values[name]));
         
         // Create a wrapper function that evaluates the snippet and calls it
         const wrapper = new Function(...paramNames, `return (${jsSnippet})(...arguments)`);
         
         return wrapper(...paramValuesFloat);
     } catch (e) {
         throw new Error(`Execution error: ${e instanceof Error ? e.message : String(e)}`);
     }
  };

  const handleRun = useCallback(() => {
    onRun(null, null);

    let hasErrors = false;
    const currentValidationErrors: { [key:string]: string | null } = {};
    
    parameters.forEach(param => {
        const value = paramValues[param.name] || '';
        const sourceFormulaName = param.source ? getSourceFormulaName(param.source) : null;

        if (sourceFormulaName) {
            if (!value) {
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
        const output = executeFormula(paramValues);
        onRun(JSON.stringify(output, null, 2), null);
    } catch (e) {
        if (e instanceof Error) {
            onRun(null, e.message);
        } else {
            onRun(null, "An unknown execution error occurred.");
        }
    }
  }, [jsSnippet, parameters, paramValues, validateParameter, onRun]);

  const handlePlot = () => {
      setPlotError(null);
      setPlotData([]);

      const start = parseFloat(rangeStart);
      const end = parseFloat(rangeEnd);
      const stepCount = parseInt(steps, 10);

      if (isNaN(start) || isNaN(end) || isNaN(stepCount) || stepCount <= 0) {
          setPlotError("Invalid range configuration.");
          return;
      }

      if (!xParam) {
          setPlotError("Please select a parameter to vary.");
          return;
      }

      const data: PlotPoint[] = [];
      const stepSize = (end - start) / stepCount;

      try {
          for (let i = 0; i <= stepCount; i++) {
              const currentX = start + (stepSize * i);
              const tempValues = { ...paramValues, [xParam]: currentX.toString() };
              
              const result = executeFormula(tempValues);

              if (typeof result !== 'number' || !isFinite(result)) {
                  // Skip invalid points (Infinity, NaN) to prevent graph crash
                  continue; 
              }
              data.push({ x: parseFloat(currentX.toFixed(4)), y: parseFloat(result.toFixed(4)) });
          }
          
          if (data.length === 0) {
              setPlotError("No valid data points generated. Check formula or range.");
          } else {
              setPlotData(data);
          }

      } catch (e) {
          if (e instanceof Error) {
              setPlotError(`Plotting error: ${e.message}`);
          } else {
              setPlotError("Unknown plotting error.");
          }
      }
  };

  const hasValidationErrors = Object.values(validationErrors).some(v => v !== null);

  return (
    <div className="mt-6 p-4 bg-slate-900/70 border border-slate-700 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-cyan-400">Interactive Sandbox</h3>
        <button 
            onClick={() => setShowGraph(!showGraph)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${showGraph ? 'bg-cyan-900/50 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white'}`}
        >
            {showGraph ? 'Hide Graph' : 'Show Graph'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {parameters.map(param => {
            const sourceFormulaName = param.source ? getSourceFormulaName(param.source) : null;
            const error = validationErrors[param.name];
            
            if (sourceFormulaName) {
                return (
                    <div key={param.name}>
                        <label htmlFor={`param-${param.name}`} className="block text-sm font-medium text-slate-400 mb-1">
                          {param.name} {param.unit && <span className="text-slate-500 font-normal">({param.unit})</span>} <span className="text-slate-500">- from {sourceFormulaName}</span>
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
                  {param.name} {param.unit && <span className="text-slate-500 font-normal">({param.unit})</span>} <span className="text-slate-500">- {param.description}</span>
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
      
      {!showGraph ? (
          <button
            onClick={handleRun}
            disabled={hasValidationErrors}
            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
          >
            Run Calculation
          </button>
      ) : (
          <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700 animate-in fade-in zoom-in duration-300">
             <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4 items-end">
                <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Vary Parameter (X-Axis)</label>
                     <select 
                        value={xParam} 
                        onChange={(e) => setXParam(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm p-2 focus:border-cyan-500 outline-none"
                     >
                         {numericParams.map(p => (
                             <option key={p.name} value={p.name}>{p.name}</option>
                         ))}
                     </select>
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Range Start</label>
                     <input type="number" value={rangeStart} onChange={e => setRangeStart(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm p-2 focus:border-cyan-500 outline-none" />
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Range End</label>
                     <input type="number" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded text-slate-300 text-sm p-2 focus:border-cyan-500 outline-none" />
                </div>
                <button 
                    onClick={handlePlot}
                    className="bg-cyan-600 text-white font-bold py-2 px-4 rounded hover:bg-cyan-500 transition-colors text-sm h-[38px]"
                >
                    Update Plot
                </button>
             </div>
             
             {plotError && <p className="text-red-400 text-sm mb-2">{plotError}</p>}
             
             {plotData.length > 0 ? (
                 <div className="w-full h-80 bg-slate-800 rounded-md p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={plotData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} />
                            <XAxis 
                                dataKey="x" 
                                stroke="#94a3b8" 
                                fontSize={12} 
                                label={{ value: xParam, position: 'insideBottom', offset: -10, fill: '#e2e8f0' }} 
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={12}
                                width={40}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '4px', color: '#f1f5f9' }}
                                itemStyle={{ color: '#06b6d4' }}
                                labelStyle={{ color: '#94a3b8' }}
                                formatter={(value: number) => [value.toFixed(4), 'Output']}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="y" 
                                stroke="#06b6d4" 
                                strokeWidth={3} 
                                dot={{ fill: '#06b6d4', r: 2 }}
                                activeDot={{ r: 6 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
             ) : (
                 <div className="h-40 flex items-center justify-center text-slate-500 italic border border-dashed border-slate-700 rounded">
                     Configure settings and click 'Update Plot' to visualize.
                 </div>
             )}
          </div>
      )}
    </div>
  );
};

export default Sandbox;
