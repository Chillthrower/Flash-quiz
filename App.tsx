import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { QuizView } from './components/QuizView';
import { parsePDFsToQuiz } from './services/geminiService';
import { AppState, ProcessedQuiz, QuizResult } from './types';
import { RotateCcw, Award, CheckCircle2, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [quizData, setQuizData] = useState<ProcessedQuiz | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    try {
      setAppState(AppState.PROCESSING);
      setError(null);
      const data = await parsePDFsToQuiz(files);
      setQuizData(data);
      setAppState(AppState.QUIZ);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process files. Please try again.");
      setAppState(AppState.UPLOAD);
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result);
    setAppState(AppState.RESULTS);
  };

  const resetApp = () => {
    setQuizData(null);
    setQuizResult(null);
    setError(null);
    setAppState(AppState.UPLOAD);
  };

  // Result View Render Helper
  const renderResults = () => {
    if (!quizResult || !quizData) return null;
    const percentage = Math.round((quizResult.score / quizResult.total) * 100);

    return (
      <div className="w-full max-w-4xl mx-auto p-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-indigo-100">You scored {percentage}%</p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex flex-col items-center">
                <span className="text-green-600 font-medium mb-1">Correct</span>
                <span className="text-2xl font-bold text-green-700">{quizResult.score}</span>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex flex-col items-center">
                <span className="text-red-600 font-medium mb-1">Incorrect</span>
                <span className="text-2xl font-bold text-red-700">{quizResult.total - quizResult.score}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center">
                <span className="text-slate-600 font-medium mb-1">Total Questions</span>
                <span className="text-2xl font-bold text-slate-700">{quizResult.total}</span>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Detailed Review</h3>
              {quizData.questions.map((q, idx) => {
                const result = quizResult.details.find(d => d.questionId === q.id);
                const isCorrect = result?.isCorrect;
                return (
                  <div key={q.id} className={`p-4 rounded-lg border-l-4 ${isCorrect ? 'border-green-500 bg-green-50/30' : 'border-red-500 bg-red-50/30'}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 shrink-0">
                        {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm mb-2"><span className="text-slate-500 mr-2">#{idx + 1}</span>{q.text}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className={`p-2 rounded ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            <span className="font-semibold block text-xs uppercase opacity-70 mb-1">Your Answer</span>
                            {q.options[result?.userAnswerIndex ?? 0]}
                          </div>
                          <div className="p-2 rounded bg-slate-100 text-slate-800">
                            <span className="font-semibold block text-xs uppercase opacity-70 mb-1">Correct Answer</span>
                            {q.options[q.correctAnswerIndex]}
                          </div>
                        </div>
                        {!isCorrect && q.explanation && (
                           <p className="mt-2 text-xs text-slate-500 italic">Explanation: {q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-center">
              <button 
                onClick={resetApp}
                className="flex items-center px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Upload New File
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              FlashQuiz
            </span>
          </div>
          <div className="text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            Powered by Gemini 2.5 Flash
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {error && (
          <div className="w-full max-w-2xl mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <XCircle className="w-5 h-5 mr-3 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {appState === AppState.UPLOAD && (
          <FileUpload onUpload={handleUpload} isLoading={false} />
        )}

        {appState === AppState.PROCESSING && (
           <FileUpload onUpload={() => {}} isLoading={true} />
        )}

        {appState === AppState.QUIZ && quizData && (
          <QuizView 
            questions={quizData.questions} 
            title={quizData.title}
            onComplete={handleQuizComplete}
            onExit={resetApp}
          />
        )}

        {appState === AppState.RESULTS && renderResults()}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} FlashQuiz. Transform your study materials instantly.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
