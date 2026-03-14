import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

function App() {
  const [code, setCode] = useState('let x = 5;\nlet y = x + 2;');
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  function handlePrev() {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }

  function handleNext() {
    setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
  }

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !current) return;

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: new monacoRef.current.Range(current.line, 1, current.line, 1),
          options: {
            isWholeLine: true,
            className: 'highlighted-line'
          }
        }
      ]
    );
  }, [currentStep]);

  async function handleRun() {
    setError(null);
    setSteps([]);
    setLoading(true);

    const response = await fetch('http://localhost:3000/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    const data = await response.json();

    if (data.error) {
      setError(data.error);
      return;
    }

    setSteps(data.steps);
    setCurrentStep(0);
  }

  const current = steps[currentStep];

  return (
    <div>
      <h1>⏱ Time Travel Debugger</h1>

      <div className="main-layout">
        <div className="editor-panel">
          <Editor
            height="100%"
            language="javascript"
            value={code}
            theme="vs-dark"
            onChange={(value) => setCode(value)}
            onMount={handleEditorMount}
          />
        </div>

        <div className="variable-panel">
          <h2>Variables</h2>
          {current && Object.entries(current.vars).map(([name, value]) => (
            <div className="variable-item" key={name}>
              <span className="variable-name">{name}</span>
              <span className="variable-value">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="controls">
        <button className="run-button" onClick={handleRun} disabled={loading}>
          {loading ? '⏳ Running...' : '▶ Run'}
        </button>
        <button className="run-button" onClick={handlePrev}>◀</button>
        <button className="run-button" onClick={handleNext}>▶</button>
        {steps.length > 0 && (
          <>
            <input
              className="slider"
              type="range"
              min={0}
              max={steps.length - 1}
              value={currentStep}
              onChange={(e) => setCurrentStep(Number(e.target.value))}
            />
            <span className="step-info">
              Step {currentStep + 1} of {steps.length} — Line {current?.line}
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="error-panel">
          ⚠ Runtime error in your code
        </div>
      )}
    </div>
  );
}

export default App;