import { GoogleGenAI, Type } from "@google/genai";
import type { FormulaResult, ChainedFormula, MultiFormulaProject } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const singleFormulaParameterSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the parameter (e.g., 'a')." },
        description: { type: Type.STRING, description: "A clear description of what the parameter represents." },
        defaultValue: { type: Type.NUMBER, description: "A sensible default numeric value for interactive testing." },
        source: { type: Type.STRING, description: "Optional. Source of this parameter's value. To use the output of another formula, use the format 'formula:FORMULA_NAME.output'. Defaults to user input." }
    },
    required: ["name", "description", "defaultValue"]
};

const singleFormulaResponseSchema = {
    type: Type.OBJECT,
    properties: {
        formulaName: { type: Type.STRING, description: "A concise name for the formula (e.g., 'Quadratic Formula')." },
        formulaString: { type: Type.STRING, description: "The mathematical formula in a clean, plain text format. Use standard symbols like ^ for power, * for multiplication." },
        explanation: { type: Type.STRING, description: "A detailed explanation of the formula's purpose, principles, and how it works." },
        parameters: {
            type: Type.ARRAY,
            description: "An array of objects, where each object describes a parameter or variable in the formula.",
            items: singleFormulaParameterSchema
        },
        codeSnippets: {
            type: Type.OBJECT,
            description: "Ready-to-use, executable code examples for the formula in popular programming languages.",
            properties: {
                javascript: { type: Type.STRING, description: "A complete, executable JavaScript arrow function string, e.g., '(a, b, c) => { ... body ... }'. It should take parameters in the same order as the 'parameters' array and return the result." },
                python: { type: Type.STRING, description: "A complete, executable Python function." },
                java: { type: Type.STRING, description: "A complete, executable Java method." },
                cpp: { type: Type.STRING, description: "A complete, executable C++ function." },
            },
            required: ["javascript", "python", "java", "cpp"]
        }
    },
    required: ["formulaName", "formulaString", "explanation", "parameters", "codeSnippets"]
};

const multiFormulaProjectResponseSchema = {
    type: Type.OBJECT,
    properties: {
        projectName: { type: Type.STRING, description: "A concise name for the overall project or system being modeled (e.g., 'Bouncing Ball Physics Simulator')." },
        projectDescription: { type: Type.STRING, description: "A high-level explanation of the project, what it accomplishes, and how the different formulas work together." },
        formulas: {
            type: Type.ARRAY,
            description: "An array of formula objects that are the components of the project.",
            items: {
                ...singleFormulaResponseSchema,
                properties: {
                    ...singleFormulaResponseSchema.properties,
                    role: { type: Type.STRING, description: "A brief description of this formula's specific role within the larger project (e.g., 'Calculates gravitational force')." },
                }
            }
        }
    },
    required: ["projectName", "projectDescription", "formulas"]
}

const callGemini = async <T>(contents: string, systemInstruction: string, temperature: number, schema: object): Promise<T> => {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate content: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the API.");
    }
};


export const generateFormulaProject = async (problemDescription: string, chainContext?: ChainedFormula[], inspire: boolean = false): Promise<MultiFormulaProject> => {
    const systemInstruction = inspire
        ? "You are 'System Architect', an expert AI acting as a creative partner. The user has provided a starting concept for a problem or system. Your task is to take this as inspiration, flesh it out into a complete and compelling project description, and then deconstruct that description into a cohesive set of core mathematical or algorithmic formulas. You can subtly enhance or rephrase the user's input for clarity and style, but you must not change its core meaning. Your final output must be a complete 'project' containing one or more well-explained formulas and practical code implementations. If the user's input is blank, generate an interesting project from scratch. Ensure all response fields are populated with high-quality, accurate content."
        : "You are 'System Architect', an expert AI that deconstructs complex user problems into a cohesive set of core mathematical or algorithmic formulas. Your mission is to provide a complete 'project' containing multiple, well-explained formulas and practical code implementations. When a project involves multiple formulas that depend on each other, clearly define these dependencies. If a parameter of one formula requires the result from another, use the 'source' field for that parameter with the format 'formula:SourceFormulaName.output'. For all parameters requiring direct user input, either omit the 'source' field or set it to 'userInput'. If a problem is simple and only requires one formula, return a project with a single formula. Ensure all response fields are populated with high-quality, accurate content.";
    
    let contents = `Analyze the following problem description and provide a complete project with the most relevant mathematical, statistical, or algorithmic formulas to solve it. Problem: "${problemDescription}"`;

    if (chainContext && chainContext.length > 0) {
        const formattedChain = chainContext.map((step, index) => 
            `Step ${index + 1}: \n- Formula: "${step.formula.formulaName}"\n- Result: ${step.result}`
        ).join('\n');
        
        contents += `\n\nCONTEXT from the preceding steps in the formula chain:\n${formattedChain}\n\nPlease generate a new project where the formulas logically follow this entire sequence. The new formulas should build upon the context provided by all previous steps.`;
    }

    const result = await callGemini<MultiFormulaProject>(contents, systemInstruction, 0.5, multiFormulaProjectResponseSchema);

    if (!result.projectName || !Array.isArray(result.formulas) || result.formulas.length === 0) {
        throw new Error("AI response is missing required project fields or formulas.");
    }
    
    return result;
};


export const inspireFormula = async (userInput: string, difficulty: string, inspire: boolean = false): Promise<FormulaResult> => {
    const systemInstruction = inspire
        ? "You are 'Algo Architect', an AI expert acting as a creative partner. A user provides a topic/idea and a difficulty level. Your task is to take this input as inspiration to generate a complete, well-rounded, and interesting problem concept. You have creative freedom to expand upon or refine the user's initial idea to create a more compelling result. If the user input is blank, generate a new concept based on the difficulty. You must return a full formula breakdown including name, formula, explanation, parameters, and code snippets. Ensure all response fields are populated with high-quality, accurate content."
        : "You are 'Algo Architect', an AI expert in mathematics and algorithms. A user provides a topic/idea and a difficulty level. Your task is to generate the most relevant and accurate formula based on their input. If the input is a specific concept, provide the canonical formula for it. If the input is a general topic, select a core, representative formula from that topic. If the input is blank, generate a random but common and useful formula based on the difficulty. You must return a full formula breakdown including name, formula, explanation, parameters, and code snippets. Ensure all response fields are populated with high-quality, accurate content.";
    const contents = `The user's starting idea is: "${userInput}". The desired difficulty is "${difficulty}". Please generate a complete formula concept.`;
    
    const result = await callGemini<FormulaResult>(contents, systemInstruction, 0.8, singleFormulaResponseSchema);
    
    if (!result.formulaName || !result.codeSnippets || !result.codeSnippets.javascript) {
        throw new Error("AI response is missing required fields.");
    }

    return result;
};

export const analyzeCode = async (code: string): Promise<FormulaResult> => {
    const systemInstruction = "You are 'Algo Architect', an AI expert in mathematics and algorithms. Your mission is to analyze a user's code snippet, identify the underlying mathematical or algorithmic formula it implements, and provide a canonical, well-explained version of that formula. Even if the code is inefficient or overly complex, your job is to distill its core logic into a standard formula. Ensure all response fields (formulaName, formulaString, explanation, parameters, codeSnippets) are populated with high-quality, accurate content based on your analysis.";
    const contents = `Analyze the following code snippet to identify the formula it implements. Provide the canonical version of that formula. Code:\n\`\`\`\n${code}\n\`\`\``;
    
    const result = await callGemini<FormulaResult>(contents, systemInstruction, 0.3, singleFormulaResponseSchema);

    if (!result.formulaName || !result.codeSnippets || !result.codeSnippets.javascript) {
        throw new Error("AI response is missing required fields.");
    }

    return result;
};

const appIdeasResponseSchema = {
    type: Type.OBJECT,
    properties: {
        ideas: {
            type: Type.ARRAY,
            description: "An array of 5 creative and practical application ideas for the given formula.",
            items: {
                type: Type.STRING,
                description: "A single application idea."
            }
        }
    },
    required: ["ideas"]
};

export const generateAppIdeas = async (formulaName: string, formulaExplanation: string): Promise<string[]> => {
    const systemInstruction = "You are a creative AI assistant. Your goal is to brainstorm practical and innovative application ideas for a given mathematical or algorithmic formula.";
    const contents = `Based on the following formula, generate exactly 5 distinct application ideas. \n\nFormula Name: "${formulaName}"\n\nExplanation: "${formulaExplanation}"`;
    
    const result = await callGemini<{ideas: string[]}>(contents, systemInstruction, 0.7, appIdeasResponseSchema);
    
    if (!result.ideas || !Array.isArray(result.ideas)) {
        throw new Error("AI response is missing 'ideas' array.");
    }

    return result.ideas as string[];
};

const nextStepSuggestionsResponseSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "An array of 3 distinct, actionable, and logical next-step suggestions for a problem-solving chain.",
            items: {
                type: Type.STRING,
                description: "A single, concise suggestion for the next problem to solve."
            }
        }
    },
    required: ["suggestions"]
};

export const suggestNextStep = async (lastStep: ChainedFormula): Promise<string[]> => {
    const systemInstruction = "You are 'ChainLinker', a helpful AI assistant. Your goal is to suggest logical next steps in a multi-step calculation or system modeling process, based on the previous step's formula and result. Provide concise, actionable prompts for the user to describe the next problem.";
    const contents = `The last step in the chain was the formula "${lastStep.formula.formulaName}", which produced the result: ${lastStep.result}. Based on this, suggest 3 logical next steps or formulas that could build upon this result.`;

    const result = await callGemini<{suggestions: string[]}>(contents, systemInstruction, 0.7, nextStepSuggestionsResponseSchema);

    if (!result.suggestions || !Array.isArray(result.suggestions)) {
        throw new Error("AI response is missing 'suggestions' array.");
    }

    return result.suggestions;
};

const chainAnalysisResponseSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: {
            type: Type.STRING,
            description: "A detailed analysis of the formula chain's logical consistency, flow, and algorithmic viability. Provide constructive feedback and identify potential issues or improvements."
        }
    },
    required: ["analysis"]
};

export const analyzeFormulaChain = async (chain: ChainedFormula[]): Promise<string> => {
    const systemInstruction = "You are 'Continuity Checker', an expert AI specializing in algorithmic and logical systems analysis. Your task is to review a chain of formulas, where each step builds upon the previous one, and provide a comprehensive analysis of its overall logical consistency and viability. Assess if the steps flow together coherently and if the final result is a sensible outcome of the sequence.";
    
    const formattedChain = chain.map((step, index) => 
        `Step ${index + 1}: \n- Formula: "${step.formula.formulaName}" (${step.formula.formulaString})\n- Result: ${step.result}`
    ).join('\n\n');

    const contents = `Please analyze the following formula chain for logical consistency and algorithmic viability. Here is the chain:\n\n${formattedChain}\n\nProvide your analysis.`;

    const result = await callGemini<{analysis: string}>(contents, systemInstruction, 0.5, chainAnalysisResponseSchema);

    if (!result.analysis) {
        throw new Error("AI response is missing the 'analysis' field.");
    }

    return result.analysis;
};