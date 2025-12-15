
export interface FormulaParameter {
  name: string;
  description: string;
  defaultValue: number;
  source?: string;
}

export interface CodeSnippets {
  javascript: string;
  python: string;
  java: string;
  cpp: string;
}

export interface FormulaResult {
  formulaName: string;
  formulaString: string;
  explanation: string;
  role?: string; // e.g., "Calculates device latency", "Models system throughput"
  parameters: FormulaParameter[];
  codeSnippets: CodeSnippets;
}

export interface ChainedFormula {
  id: string;
  formula: FormulaResult;
  result: string;
}

export interface MultiFormulaProject {
  projectName: string;
  projectDescription: string;
  formulas: FormulaResult[];
}