import React, { useState, useEffect } from 'react';

function PollForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du sondage
  const [pollTxt, setPollTxt] = useState('');
  const [answers, setAnswers] = useState([
    { answerTxt: '', answerCounter: 0 },
    { answerTxt: '', answerCounter: 0 }
  ]);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setPollTxt(currentEmbed.pollTxt || '');
      setAnswers(currentEmbed.answers || [
        { answerTxt: '', answerCounter: 0 },
        { answerTxt: '', answerCounter: 0 }
      ]);
    }
  }, [formMode, currentEmbed]);

  // Notification des changements au parent
  useEffect(() => {
    onChange({
      pollTxt,
      answers,
      type: 'poll'
    });
  }, [pollTxt, answers]); // Suppression de onChange des dépendances

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index].answerTxt = value;
    setAnswers(newAnswers);
  };

  const addAnswer = () => {
    setAnswers([...answers, { answerTxt: '', answerCounter: 0 }]);
  };

  const removeAnswer = (index) => {
    if (answers.length > 2) { // Minimum 2 réponses
      const newAnswers = answers.filter((_, i) => i !== index);
      setAnswers(newAnswers);
    }
  };

  return (
    <div className="poll-form">
      {/* Question du sondage */}
      <div className="mb-4">
        <label className="minilabel">
          Question du sondage *
        </label>
        <input
          type="text"
          value={pollTxt}
          onChange={(e) => setPollTxt(e.target.value)}
          placeholder="Quelle est votre question ?"
          className="field mb-2"
          required
        />
      </div>

      {/* Réponses possibles */}
      <div className="mb-4 bg-gray-100 p-3 rounded-md">
        <label className="minilabel">
          Réponses possibles *
        </label>
        {answers.map((answer, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={answer.answerTxt}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder={`Réponse ${index + 1}`}
              className="field mb-2"
              required
            />
            {answers.length > 2 && (
              <button
                type="button"
                onClick={() => removeAnswer(index)}
                className="px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                title="Supprimer cette réponse"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addAnswer}
          className="text-sm text-blick hover:text-blue-700"
        >
          + Ajouter une réponse
        </button>
      </div>
    </div>
  );
}

export default PollForm;
