import { type PyodideInterface } from 'pyodide';

let pyodideInstance: PyodideInterface | null = null;

export async function initPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  try {
    // @ts-ignore - Pyodide is loaded from CDN
    const { loadPyodide } = window;
    if (!loadPyodide) {
      throw new Error('Pyodide not loaded. Make sure the script is included in your HTML.');
    }

    pyodideInstance = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
      stdout: (text: string) => console.log('Python stdout:', text),
      stderr: (text: string) => console.error('Python stderr:', text),
    });

    return pyodideInstance;
  } catch (error) {
    console.error('Failed to initialize Pyodide:', error);
    throw error;
  }
}

export async function runPythonCode(code: string): Promise<{ output: string; error: string | null }> {
  try {
    const pyodide = await initPyodide();
    
    // Create a custom stdout/stderr capture
    const stdout = pyodide.runPython(`
      import io, sys
      stdout = io.StringIO()
      stderr = io.StringIO()
      sys.stdout = stdout
      sys.stderr = stderr
      stdout, stderr
    `);

    // Run the user's code
    await pyodide.runPythonAsync(code);

    // Get captured output
    const output = stdout[0].getvalue();
    const error = stdout[1].getvalue();

    // Reset stdout/stderr
    pyodide.runPython(`
      sys.stdout = sys.__stdout__
      sys.stderr = sys.__stderr__
    `);

    return {
      output: output || '',
      error: error || null
    };
  } catch (error) {
    console.error('Python execution error:', error);
    return {
      output: '',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}