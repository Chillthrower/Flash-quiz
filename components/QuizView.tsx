import React, { useState } from 'react';
import { CheckCircle, XCircle, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';
import { Question, QuizResult } from '../types';

interface QuizViewProps {
  questions: Question[];
  title: string;
  onComplete: (result: QuizResult) => void;
  onExit: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions, title, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ questionId: string; isCorrect: boolean; userAnswerIndex: number }[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;
    const newAnswer = {
      questionId: currentQuestion.id,
      isCorrect,
      userAnswerIndex: selectedOption
    };

    setUserAnswers([...userAnswers, newAnswer]);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Calculate score
      const finalAnswers = [...userAnswers]; 
      // Note: we don't need to add the current one here because it was added in handleSubmitAnswer
      
      const score = finalAnswers.filter(a => a.isCorrect).length;
      onComplete({
        score,
        total: questions.length,
        details: finalAnswers
      });
    }
  };

  const getOptionStyle = (index: number) => {
    if (!isAnswered) {
      return selectedOption === index
        ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
        : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50";
    }

    if (index === currentQuestion.correctAnswerIndex) {
      return "border-green-500 bg-green-50 ring-1 ring-green-500";
    }

    if (selectedOption === index && index !== currentQuestion.correctAnswerIndex) {
      return "border-red-500 bg-red-50 ring-1 ring-red-500";
    }

    return "border-slate-200 opacity-50";
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onExit} className="text-slate-500 hover:text-slate-800 flex items-center text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Exit Quiz
          </button>
          <span className="text-sm font-semibold text-slate-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-relaxed">
          {currentQuestion.text}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={isAnswered}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${getOptionStyle(index)}`}
            >
              <div className="flex items-center">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mr-4 transition-colors ${
                  isAnswered && index === currentQuestion.correctAnswerIndex ? 'bg-green-200 text-green-800' :
                  isAnswered && selectedOption === index && index !== currentQuestion.correctAnswerIndex ? 'bg-red-200 text-red-800' :
                  selectedOption === index ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className={`font-medium ${isAnswered && index === currentQuestion.correctAnswerIndex ? 'text-green-800' : 'text-slate-700'}`}>
                  {option}
                </span>
              </div>
              
              {isAnswered && index === currentQuestion.correctAnswerIndex && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
              {isAnswered && selectedOption === index && index !== currentQuestion.correctAnswerIndex && (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation & Controls */}
      <div className="space-y-6">
        {isAnswered && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">Explanation</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          {!isAnswered ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all transform ${
                selectedOption === null 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5'
              }`}
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center px-8 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
