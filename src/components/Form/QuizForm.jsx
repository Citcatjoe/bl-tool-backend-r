import React, { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';

function QuizForm({ currentEmbed, formMode, onChange }) {
  // Champs conclusion
  const [conclusion, setConclusion] = useState({ text1: '', text2: '', text3: '' });

  // Initialisation en mode édition pour la conclusion
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed?.conclusion) {
      setConclusion({
        text1: currentEmbed.conclusion.text1 || '',
        text2: currentEmbed.conclusion.text2 || '',
        text3: currentEmbed.conclusion.text3 || '',
      });
    }
  }, [formMode, currentEmbed]);
  // Titre du quiz
  const [title, setTitle] = useState('');
  // Image du quiz
  const [img, setImg] = useState('');
  // Questions du quiz (ajout du champ img)
  const [questions, setQuestions] = useState([
    {
      text: '',
      hint: '',
      img: '',
      answers: [
        { isCorrect: false, text: '' },
        { isCorrect: false, text: '' },
        { isCorrect: false, text: '' },
        { isCorrect: false, text: '' },
      ],
    },
  ]);
  // Tableau statsQuestions synchronisé avec questions
  const [statsQuestions, setStatsQuestions] = useState([
    { correct: 0, incorrect: 0 },
  ]);

  // Initialisation en mode édition
  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setTitle(currentEmbed.title || '');
      setImg(currentEmbed.img || '');
      const loadedQuestions =
        currentEmbed.questions && Array.isArray(currentEmbed.questions)
          ? currentEmbed.questions.map(q => ({
              text: q.text || '',
              hint: q.hint || '',
              img: q.img || '',
              answers: Array.isArray(q.answers)
                ? q.answers.map(a => ({ isCorrect: !!a.isCorrect, text: a.text || '' }))
                : [
                    { isCorrect: false, text: '' },
                    { isCorrect: false, text: '' },
                    { isCorrect: false, text: '' },
                    { isCorrect: false, text: '' },
                  ],
            }))
          : [
              {
                text: '',
                hint: '',
                img: '',
                answers: [
                  { isCorrect: false, text: '' },
                  { isCorrect: false, text: '' },
                  { isCorrect: false, text: '' },
                  { isCorrect: false, text: '' },
                ],
              },
            ];
      setQuestions(loadedQuestions);
      // statsQuestions doit être synchronisé en nombre et ordre
      const loadedStats = Array.isArray(currentEmbed.statsQuestions)
        ? currentEmbed.statsQuestions.map(sq => ({
            correct: typeof sq.correct === 'number' ? sq.correct : 0,
            incorrect: typeof sq.incorrect === 'number' ? sq.incorrect : 0,
          }))
        : [];
      // Si statsQuestions n'est pas de la bonne taille, on complète
      let stats = loadedStats;
      if (loadedQuestions.length > loadedStats.length) {
        stats = [
          ...loadedStats,
          ...Array(loadedQuestions.length - loadedStats.length).fill({ correct: 0, incorrect: 0 }),
        ];
      } else if (loadedQuestions.length < loadedStats.length) {
        stats = loadedStats.slice(0, loadedQuestions.length);
      }
      if (stats.length === 0) {
        stats = loadedQuestions.map(() => ({ correct: 0, incorrect: 0 }));
      }
      setStatsQuestions(stats);
    }
  }, [formMode, currentEmbed]);

  // Remonter la donnée au parent
  useEffect(() => {
    onChange({ type: 'quiz', title, img, questions, statsQuestions, conclusion });
  }, [title, img, questions, statsQuestions, conclusion, onChange]);

  // Ajout d'une question
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        text: '',
        hint: '',
        img: '',
        answers: [
          { isCorrect: false, text: '' },
          { isCorrect: false, text: '' },
          { isCorrect: false, text: '' },
          { isCorrect: false, text: '' },
        ],
      },
    ]);
    setStatsQuestions(prev => [
      ...prev,
      { correct: 0, incorrect: 0 },
    ]);
  };

  // Suppression d'une question
  const removeQuestion = idx => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== idx));
      setStatsQuestions(statsQuestions.filter((_, i) => i !== idx));
    }
  };

  // Réordonnage haut/bas
  const moveQuestion = (idx, direction) => {
    const newQuestions = [...questions];
    const newStats = [...statsQuestions];
    if (direction === 'up' && idx > 0) {
      [newQuestions[idx - 1], newQuestions[idx]] = [newQuestions[idx], newQuestions[idx - 1]];
      [newStats[idx - 1], newStats[idx]] = [newStats[idx], newStats[idx - 1]];
    } else if (direction === 'down' && idx < newQuestions.length - 1) {
      [newQuestions[idx + 1], newQuestions[idx]] = [newQuestions[idx], newQuestions[idx + 1]];
      [newStats[idx + 1], newStats[idx]] = [newStats[idx], newStats[idx + 1]];
    }
    setQuestions(newQuestions);
    setStatsQuestions(newStats);
  };

  // Gestion des réponses (4 fixes)
  const updateAnswer = (qIdx, aIdx, field, value) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].answers[aIdx][field] = value;
    setQuestions(newQuestions);
  };

  // Sélectionne la bonne réponse (radio)
  const setCorrectAnswer = (qIdx, aIdx) => {
    const newQuestions = [...questions];
    newQuestions[qIdx].answers = newQuestions[qIdx].answers.map((ans, i) => ({ ...ans, isCorrect: i === aIdx }));
    setQuestions(newQuestions);
  };

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Titre du quiz *</label>
        <input
          type="text"
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre du quiz"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Questions</label>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={idx} className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">Question {idx + 1}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      className="btn-form"
                      title="Déplacer vers le haut"
                    >↑</button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="btn-form"
                      title="Déplacer vers le bas"
                    >↓</button>
                    {/* Bouton de suppression, masqué si une seule question */}
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="btn-form btn-delete"
                        title="Supprimer la question"
                      >×</button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <input
                    type="text"
                    placeholder="Texte de la question"
                    value={q.text}
                    onChange={e => {
                      const newQuestions = [...questions];
                      newQuestions[idx].text = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Complément d'information"
                    value={q.hint}
                    onChange={e => {
                      const newQuestions = [...questions];
                      newQuestions[idx].hint = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Image de la question */}
                <div className="mb-3">
                  <ImageUploader
                    type='quiz'
                    initialUrl={q.img}
                    oldUrl={q.img}
                    label={`Image de la question ${idx + 1}`}
                    disabled={false}
                    onUpload={url => {
                      const newQuestions = [...questions];
                      newQuestions[idx].img = url;
                      setQuestions(newQuestions);
                    }}
                  />
                </div>
                <div className="">
                  <span className="block text-sm font-medium text-gray-700 mb-3">Réponses</span>
                  <div className="space-y-2">
                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Réponse ${aIdx + 1}`}
                          value={a.text}
                          onChange={e => updateAnswer(idx, aIdx, 'text', e.target.value)}
                          required
                        />
                        <input
                          type="radio"
                          name={`correct-answer-${idx}`}
                          checked={a.isCorrect}
                          onChange={() => setCorrectAnswer(idx, aIdx)}
                          className="form-radio h-4 w-8 text-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-blick text-sm mt-3"
            onClick={addQuestion}
          >+ Ajouter une question</button>
        </div>
      </div>
      {/* Bloc conclusion */}
      <div>
        {/* <label className="block text-sm font-medium text-gray-700 mb-3">Conclusion</label> */}
        <div className="flex gap-4">
          <div className="flex flex-col w-full">
            <label className="block text-sm font-medium text-gray-600 mb-3">Texte 0% - 33%</label>
            <textarea
              className="field w-full h-48 resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Conclusion 1"
              value={conclusion.text1}
              onChange={e => setConclusion(c => ({ ...c, text1: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="block text-sm font-medium text-gray-600 mb-3">Texte 34% - 66%</label>
            <textarea
              className="field w-full h-48 resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Conclusion 2"
              value={conclusion.text2}
              onChange={e => setConclusion(c => ({ ...c, text2: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="block text-sm font-medium text-gray-600 mb-3">Texte 67% - 100%</label>
            <textarea
              className="field w-full h-48 resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Conclusion 3"
              value={conclusion.text3}
              onChange={e => setConclusion(c => ({ ...c, text3: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export default QuizForm;