
import React, { useState } from 'react';

interface CodeSnippetProps {
  code: string;
}

const CodeSnippet: React.FC<CodeSnippetProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-slate-800 rounded-lg group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-2 py-1 text-xs bg-slate-600 text-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="p-4 text-sm text-slate-300 overflow-x-auto rounded-lg">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
};

export default CodeSnippet;
