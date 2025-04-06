import { supabase } from './supabase';

interface CompilerResponse {
  output: string;
  error: string | null;
  exitCode: number;
}

export async function compileCppCode(code: string, input: string = ''): Promise<CompilerResponse> {
  try {
    const { data: functionData } = await supabase.functions.invoke('code-compiler', {
      body: { code, input }
    });

    if (!functionData) {
      throw new Error('No response from compiler service');
    }

    return {
      output: functionData.output || '',
      error: functionData.error || null,
      exitCode: functionData.exitCode || 1
    };
  } catch (error) {
    console.error('Compilation error:', error);
    return {
      output: '',
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      exitCode: 1
    };
  }
}