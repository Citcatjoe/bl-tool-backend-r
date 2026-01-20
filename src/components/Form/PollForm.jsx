import React, { useState, useEffect } from 'react';

function PollForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du sondage
  const [pollTxt, setPollTxt] = useState('');
  const [answerTxts, setAnswerTxts] = useState(['', '']);
  const [answerCounters, setAnswerCounters] = useState([0, 0]);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setPollTxt(currentEmbed.pollTxt || '');
      setAnswerTxts(Array.isArray(currentEmbed.answerTxts) ? currentEmbed.answerTxts : ['', '']);
      setAnswerCounters(Array.isArray(currentEmbed.answerCounters) ? currentEmbed.answerCounters : [0, 0]);
    }
  }, [formMode, currentEmbed]);

  // Notification des changements au parent
  useEffect(() => {
    onChange({
      pollTxt,
      answerTxts,
      answerCounters,
      type: 'poll'
    });
  }, [pollTxt, answerTxts, answerCounters]);

  const handleAnswerChange = (index, value) => {
  const newTxts = [...answerTxts];
  newTxts[index] = value;
  setAnswerTxts(newTxts);
  };

  const addAnswer = () => {
  setAnswerTxts([...answerTxts, '']);
  setAnswerCounters([...answerCounters, 0]);
  };

  const removeAnswer = (index) => {
    if (answerTxts.length > 2) { // Minimum 2 réponses
      const newTxts = answerTxts.filter((_, i) => i !== index);
      const newCounters = answerCounters.filter((_, i) => i !== index);
      setAnswerTxts(newTxts);
      setAnswerCounters(newCounters);
    }
  };

  return (
    <div className="space-y-4">
      {/* Question du sondage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question du sondage *
        </label>
        <input
          type="text"
          value={pollTxt}
          onChange={(e) => setPollTxt(e.target.value)}
          placeholder="Quelle est votre question ?"
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Réponses possibles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Réponses possibles *
        </label>
        <div className="bg-gray-50 border border-gray-300 p-4 rounded-md">
          <div className="space-y-3">
            {answerTxts.map((txt, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  value={txt}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder={`Réponse ${index + 1}`}
                  className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {/* Affichage du compteur (lecture seule) */}
                {/* <span className="text-xs text-gray-400 ml-2">Votes: {answerCounters[index]}</span> */}
                {answerTxts.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeAnswer(index)}
                    className="btn-form btn-delete"
                    title="Supprimer cette réponse"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addAnswer}
            className="text-blick text-sm mt-3"
          >
            + Ajouter une réponse
          </button>
        </div>
      </div>
    </div>
  );
}

export default PollForm;
