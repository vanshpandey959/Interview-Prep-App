import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const CandidateSelector = ({ onStartInterview, isLoading }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setIsFetching(true);
        setFetchError(null);
        const data = await apiService.getCandidates();

        // Backend returns { candidates: [...] }
        const rawList = Array.isArray(data?.candidates) ? data.candidates : [];
        setCandidates(rawList);

        if (rawList.length > 0) {
          setSelectedCandidate(rawList[0]);
        }
      } catch (err) {
        console.error('Failed to fetch candidates:', err);
        setFetchError(err.message);
      } finally {
        setIsFetching(false);
      }
    };

    fetchCandidates();
  }, []);

  const handleStart = () => {
    if (!selectedCandidate) return;
    const sessionId = `session-${Date.now()}`;
    onStartInterview(sessionId, selectedCandidate);
  };

  return (
    <div className="max-w-xl mx-auto mt-16 p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
      <h1 className="text-2xl font-bold text-indigo-400 mb-2">AI Technical Interviewer</h1>
      <p className="text-slate-400 text-sm mb-6">Select a candidate profile to initialize the adaptive interview session.</p>

      {isFetching ? (
        <div className="p-6 text-center text-slate-400 animate-pulse text-sm">
          Loading candidates...
        </div>
      ) : fetchError ? (
        <div className="p-6 text-center text-red-400 border border-red-900/50 bg-red-950/20 rounded-xl mb-6 text-sm">
          Failed to load candidates: {fetchError}
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-6 text-center text-amber-400 border border-amber-900/50 bg-amber-950/20 rounded-xl mb-6 text-sm">
          No candidates found. Check candidates.json file in backend.
        </div>
      ) : (
        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-1">
          {Array.isArray(candidates) && candidates.map((cand, idx) => {
            const member = cand.member || cand;
            const candidateId = member.id || cand.id || `cand-${idx}`;
            const isSelected = selectedCandidate && (selectedCandidate.id === candidateId || selectedCandidate.member?.id === candidateId);

            return (
              <div
                key={candidateId}
                onClick={() => setSelectedCandidate(cand)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-slate-200">{member.name || 'Unnamed Candidate'}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                    {member.jobRole || cand.role || 'Software Engineer'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Experience: {member.yearsExperience || cand.experience || 'N/A'} yrs | 
                  Missions: {cand.signals?.missionsCompleted ?? cand.missions?.length ?? 0} completed
                </p>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={isLoading || isFetching || !selectedCandidate}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-medium rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20"
      >
        {isLoading ? <span>Initializing Session...</span> : <span>Begin Technical Interview</span>}
      </button>
    </div>
  );
};