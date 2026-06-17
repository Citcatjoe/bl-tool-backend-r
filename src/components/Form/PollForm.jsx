import React, { useState, useEffect } from 'react';
import RepeatableBlockActions from './RepeatableBlockActions';

function PollForm({ currentEmbed, formMode, onChange }) {
  // States pour les champs du sondage
  const [pollTxt, setPollTxt] = useState('');
  const [answers, setAnswers] = useState([
    { id: 'initial-0', text: '', votes: 0, originalText: '' },
    { id: 'initial-1', text: '', votes: 0, originalText: '' }
  ]);
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  // Initialisation des données en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setPollTxt(currentEmbed.pollTxt || '');
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);

      if (Array.isArray(currentEmbed.answerTxts)) {
        const loadedAnswers = currentEmbed.answerTxts.map((txt, index) => ({
          id: `loaded-${index}-${Date.now()}`,
          text: txt || '',
          votes: Array.isArray(currentEmbed.answerCounters) ? (currentEmbed.answerCounters[index] || 0) : 0,
          originalText: txt || ''
        }));
        setAnswers(loadedAnswers);
      } else {
        setAnswers([
          { id: 'initial-0', text: '', votes: 0 },
          { id: 'initial-1', text: '', votes: 0 }
        ]);
      }
    }
  }, [formMode, currentEmbed]);

  // Notification des changements au parent
  useEffect(() => {
    const txts = answers.map(a => a.text);
    const counters = answers.map(a => a.votes);
    const originalTxts = answers.map(a => a.originalText || '');
    onChange({
      pollTxt,
      answerTxts: txts,
      answerCounters: counters,
      answerOriginalTxts: originalTxts,
      brand,
      theme,
      type: 'poll'
    });
  }, [pollTxt, answers, brand, theme]);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index].text = value;
    setAnswers(newAnswers);
  };

  const moveAnswerUp = (index) => {
    if (index === 0) return;
    const newAnswers = [...answers];
    [newAnswers[index - 1], newAnswers[index]] = [newAnswers[index], newAnswers[index - 1]];
    setAnswers(newAnswers);
  };

  const moveAnswerDown = (index) => {
    if (index === answers.length - 1) return;
    const newAnswers = [...answers];
    [newAnswers[index], newAnswers[index + 1]] = [newAnswers[index + 1], newAnswers[index]];
    setAnswers(newAnswers);
  };

  const removeAnswer = (index) => {
    if (answers.length > 2) {
      const newAnswers = answers.filter((_, i) => i !== index);
      setAnswers(newAnswers);
    }
  };

  const addAnswer = () => {
    const newId = Date.now() + '-' + answers.length;
    setAnswers([...answers, { id: newId, text: '', votes: 0, originalText: '' }]);
  };

  return (
    <div className="space-y-6">
      {/* Brand choice & Rubrique */}
      <div className="flex gap-6 items-start">
        {/* Brand */}
        <div className="flex-none w-44">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <div className="flex gap-4 items-center h-12">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="brand"
                value="blick"
                checked={brand === 'blick'}
                onChange={() => setBrand('blick')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Blick</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="radio"
                name="brand"
                value="pme"
                checked={brand === 'pme'}
                onChange={() => setBrand('pme')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700">Pme</span>
            </label>
          </div>
        </div>

        {/* Rubrique */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rubrique *
          </label>
          <select
            value={theme || ''}
            onChange={(e) => setTheme(e.target.value || null)}
            className={`field mb-0 w-full px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer ${!theme ? 'text-gray-400' : 'text-gray-700'
              }`}
            required
          >
            <option value="" disabled hidden>Sélectionner...</option>
            <option value="Suisse" className="text-gray-700">Suisse</option>
            <option value="Inter" className="text-gray-700">Inter</option>
            <option value="Sport" className="text-gray-700">Sport</option>
          </select>
        </div>
      </div>

      <div className="py-4">
        <hr className="border-gray-200" />
      </div>

      {/* Question du sondage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question du sondage *
        </label>
        <input
          type="text"
          value={pollTxt}
          onChange={(e) => setPollTxt(e.target.value)}
          placeholder="Êtes-vous favorable à la semaine de 4 jours en Suisse ?"
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Réponses possibles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Réponses possibles *
        </label>
        <div className="space-y-3">
          {answers.map((item, index) => (
            <div key={item.id} className="bg-gray-50 border border-gray-300 rounded-md overflow-hidden shadow-sm">
              <RepeatableBlockActions 
                index={index}
                total={answers.length}
                onMoveUp={moveAnswerUp}
                onMoveDown={moveAnswerDown}
                onRemove={answers.length > 2 ? removeAnswer : null}
                title={`Réponse ${index + 1}`}
              />
              <div className="p-4 flex items-center gap-3 bg-white">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={
                      index === 0 ? "Oui, c'est une excellente idée" :
                      index === 1 ? "Non, cela nuirait à notre économie" :
                      index === 2 ? "Sans opinion" :
                      `Option ${index + 1}`
                    }
                    className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  />
                </div>
                {item.votes > 0 && (
                  <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-md shadow-sm whitespace-nowrap flex items-center gap-1.5" title="Nombre de votes enregistrés">
                    {item.votes} {item.votes > 1 ? 'votes' : 'vote'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addAnswer}
          className="text-blick hover:underline text-sm mt-4 font-medium flex items-center"
        >
          + Ajouter une réponse
        </button>
      </div>
    </div>
  );
}

export default PollForm;
