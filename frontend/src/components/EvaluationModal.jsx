import React from 'react';

export const EvaluationModal = ({ feedback, onRestart }) => {
  if (!feedback) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-emerald-400 mb-2">Interview Completed</h2>
        <p className="text-slate-400 text-sm mb-6">Detailed performance analysis and curriculum diagnostic report.</p>

        <div className="space-y-6">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-semibold text-indigo-400 mb-1">Executive Summary</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{feedback.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Demonstrated Strengths</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                {feedback.strengths?.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Identified Knowledge Gaps</h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                {feedback.gaps?.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Recommended Next Steps</h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
              {feedback.next?.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="mt-8 w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-medium rounded-xl transition-all shadow-lg"
        >
          Start New Interview Session
        </button>
      </div>
    </div>
  );
};