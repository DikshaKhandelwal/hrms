import React, { useState } from 'react';
import { Mic, Play, StopCircle, MessageSquare, TrendingUp } from 'lucide-react';

interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

interface InterviewResult {
  transcript: string;
  sentimentScore: number;
  confidenceScore: number;
  communicationRating: number;
  technicalRating: number;
  recommendation: string;
}

export const VoiceInterview: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const questions: InterviewQuestion[] = [
    { id: 1, question: 'Tell me about yourself and your professional background.', category: 'Introduction' },
    { id: 2, question: 'What motivated you to apply for this position?', category: 'Motivation' },
    { id: 3, question: 'Describe a challenging project you worked on and how you overcame obstacles.', category: 'Technical' },
    { id: 4, question: 'How do you handle working under pressure and tight deadlines?', category: 'Behavioral' },
    { id: 5, question: 'Where do you see yourself in the next 5 years?', category: 'Career Goals' },
  ];

  const mockResults: InterviewResult = {
    transcript: 'Candidate demonstrated strong communication skills and technical knowledge. Showed enthusiasm for the role and company. Provided detailed examples of past experience...',
    sentimentScore: 82,
    confidenceScore: 78,
    communicationRating: 4.2,
    technicalRating: 3.8,
    recommendation: 'Strong candidate. Recommend moving forward to technical round. Shows good cultural fit and motivation.',
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setCurrentQuestion(0);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setIsRecording(false);
    } else {
      setInterviewStarted(false);
      setShowResults(true);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Interview Analysis Results</h2>
            <button
              onClick={() => setShowResults(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
            >
              New Interview
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-2">Sentiment Score</p>
              <div className="flex items-end space-x-3">
                <p className="text-4xl font-bold text-blue-900">{mockResults.sentimentScore}</p>
                <p className="text-blue-600 mb-1">/100</p>
              </div>
              <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${mockResults.sentimentScore}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <p className="text-sm font-medium text-green-700 mb-2">Confidence Score</p>
              <div className="flex items-end space-x-3">
                <p className="text-4xl font-bold text-green-900">{mockResults.confidenceScore}</p>
                <p className="text-green-600 mb-1">/100</p>
              </div>
              <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${mockResults.confidenceScore}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-6 border border-violet-200">
              <p className="text-sm font-medium text-violet-700 mb-2">Communication Rating</p>
              <div className="flex items-end space-x-3">
                <p className="text-4xl font-bold text-violet-900">{mockResults.communicationRating}</p>
                <p className="text-violet-600 mb-1">/5.0</p>
              </div>
              <div className="mt-3 flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-full h-2 rounded ${
                      star <= Math.floor(mockResults.communicationRating) ? 'bg-violet-600' : 'bg-violet-200'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
              <p className="text-sm font-medium text-amber-700 mb-2">Technical Rating</p>
              <div className="flex items-end space-x-3">
                <p className="text-4xl font-bold text-amber-900">{mockResults.technicalRating}</p>
                <p className="text-amber-600 mb-1">/5.0</p>
              </div>
              <div className="mt-3 flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-full h-2 rounded ${
                      star <= Math.floor(mockResults.technicalRating) ? 'bg-amber-600' : 'bg-amber-200'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Interview Transcript Summary</span>
            </h3>
            <p className="text-slate-700 leading-relaxed">{mockResults.transcript}</p>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>AI Recommendation</span>
            </h3>
            <p className="text-green-800 leading-relaxed">{mockResults.recommendation}</p>
          </div>
        </div>
      </div>
    );
  }

  if (interviewStarted) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-8 border border-slate-200">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-600">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                  {questions[currentQuestion].category}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-8 mb-8 border border-slate-200">
              <p className="text-xl text-slate-900 leading-relaxed">
                {questions[currentQuestion].question}
              </p>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <button
                onClick={toggleRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {isRecording ? (
                  <StopCircle className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>

              <p className="text-sm text-slate-600">
                {isRecording ? 'Recording... Click to stop' : 'Click to start recording your answer'}
              </p>

              {isRecording && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-600">Live</span>
                </div>
              )}

              <button
                onClick={handleNextQuestion}
                className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
              >
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">AI Voice Interview Bot</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Conduct initial candidate screening with our AI-powered voice interview system.
            The bot will ask structured questions and analyze responses for sentiment, confidence, and communication skills.
          </p>

          <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-3">Interview Details:</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start space-x-2">
                <span className="text-slate-400">•</span>
                <span>{questions.length} questions covering multiple categories</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400">•</span>
                <span>Approximately 10-15 minutes duration</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400">•</span>
                <span>Real-time voice recording and transcription</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400">•</span>
                <span>AI analysis of sentiment, confidence, and communication</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-slate-400">•</span>
                <span>Detailed scorecard and hiring recommendation</span>
              </li>
            </ul>
          </div>

          <button
            onClick={startInterview}
            className="px-8 py-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium text-lg"
          >
            <div className="flex items-center space-x-3">
              <Play className="w-5 h-5" />
              <span>Start Interview</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
