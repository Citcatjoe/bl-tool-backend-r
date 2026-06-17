import React, { useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader';
import RepeatableBlockActions from './RepeatableBlockActions';

function QuizForm({ currentEmbed, formMode, onChange }) {
  // Champs conclusion
  const [conclusion, setConclusion] = useState({ text1: '', text2: '', text3: '' });

  // Titre du quiz
  const [title, setTitle] = useState('');
  // Image du quiz
  const [img, setImg] = useState('');
  // Brand & theme
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  // Questions du quiz
  const [questions, setQuestions] = useState([
    {
      text: '',
      hint: '',
      img: '',
      hidePercent: false,
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
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);

      if (currentEmbed.conclusion) {
        setConclusion({
          text1: currentEmbed.conclusion.text1 || '',
          text2: currentEmbed.conclusion.text2 || '',
          text3: currentEmbed.conclusion.text3 || '',
        });
      }

      const loadedQuestions =
        currentEmbed.questions && Array.isArray(currentEmbed.questions)
          ? currentEmbed.questions.map(q => ({
              text: q.text || '',
              hint: q.hint || '',
              img: q.img || '',
              hidePercent: !!q.hidePercent,
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
                hidePercent: false,
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
    onChange({ type: 'quiz', title, img, questions, statsQuestions, conclusion, brand, theme });
  }, [title, img, questions, statsQuestions, conclusion, brand, theme, onChange]);

  // Ajout d'une question
  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        text: '',
        hint: '',
        img: '',
        hidePercent: false,
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
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module de quiz n'est pas encore compatible avec la brand PME.">
              <input
                type="radio"
                name="brand"
                value="pme"
                checked={brand === 'pme'}
                onChange={() => setBrand('pme')}
                disabled
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-not-allowed"
              />
              <span className="text-sm text-gray-400">Pme</span>
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

      {/* Titre du quiz */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre du quiz *
        </label>
        <input
          type="text"
          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Connaissez-vous les chanteurs suisses les plus célèbres ?"
          required
        />
      </div>

      {/* Image du quiz */}
      <div>
        <ImageUploader
          type="quiz"
          initialUrl={img}
          oldUrl={formMode === 'edit' ? img : ''}
          label="Image de couverture du quiz"
          disabled={false}
          onUpload={setImg}
        />
      </div>

      {/* Questions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Questions *
        </label>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-300 rounded-md overflow-hidden shadow-sm">
              <RepeatableBlockActions
                index={idx}
                total={questions.length}
                onMoveUp={() => moveQuestion(idx, 'up')}
                onMoveDown={() => moveQuestion(idx, 'down')}
                onRemove={questions.length > 1 ? () => removeQuestion(idx) : null}
                title={`Question ${idx + 1}`}
              />

              <div className="p-4 bg-white space-y-4">
                {/* Texte de la question & Complément */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Texte de la question <span style={{ display: 'none' }}>#{idx + 1}</span> *
                    </label>
                    <input
                      type="text"
                      placeholder="Quel chanteur suisse a vendu le plus de disques ?"
                      value={q.text}
                      onChange={e => {
                        const newQuestions = [...questions];
                        newQuestions[idx].text = e.target.value;
                        setQuestions(newQuestions);
                      }}
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Complément d'information
                    </label>
                    <input
                      type="text"
                      placeholder="Effectivement, depuis 1884..."
                      value={q.hint}
                      onChange={e => {
                        const newQuestions = [...questions];
                        newQuestions[idx].hint = e.target.value;
                        setQuestions(newQuestions);
                      }}
                      className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                {/* Image de la question */}
                <div>
                  <ImageUploader
                    type="quiz"
                    initialUrl={q.img}
                    oldUrl={q.img}
                    label="Image de la question"
                    disabled={false}
                    onUpload={url => {
                      const newQuestions = [...questions];
                      newQuestions[idx].img = url;
                      setQuestions(newQuestions);
                    }}
                  />
                </div>

                {/* Réponses */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Réponses possibles (Cochez la réponse correcte) <span style={{ display: 'none' }}>#{idx + 1}</span> *
                  </label>
                  <div className="space-y-2">
                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <label style={{ display: 'none' }}>
                            Réponse {aIdx + 1} de la question <span style={{ display: 'none' }}>#{idx + 1}</span>
                          </label>
                          <input
                            type="text"
                            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder={["Stephan Eicher", "Bastian Baker", "DJ BoBo", "Gjon's Tears"][aIdx] || `Réponse ${aIdx + 1}`}
                            value={a.text}
                            onChange={e => updateAnswer(idx, aIdx, 'text', e.target.value)}
                            required
                          />
                        </div>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="radio"
                            name={`correct-answer-${idx}`}
                            checked={a.isCorrect}
                            onChange={() => setCorrectAnswer(idx, aIdx)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs text-gray-500 font-medium">Correct</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Masquer les pourcentages */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`hidePercent-${idx}`}
                    checked={q.hidePercent || false}
                    onChange={e => {
                      const newQuestions = [...questions];
                      newQuestions[idx].hidePercent = e.target.checked;
                      setQuestions(newQuestions);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2 cursor-pointer"
                  />
                  <label htmlFor={`hidePercent-${idx}`} className="block text-sm text-gray-700 select-none cursor-pointer">
                    Masquer les pourcentages lors de la réponse
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="text-blick hover:underline text-sm mt-4 font-medium flex items-center"
          onClick={addQuestion}
        >
          + Ajouter une question
        </button>
      </div>

      {/* Bloc conclusion */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Texte de conclusion selon le score *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 border border-gray-300 p-4 rounded-md shadow-sm">
          <div className="flex flex-col w-full">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Score : 0% - 33% *
            </label>
            <textarea
              className="field w-full h-32 resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Peut mieux faire ! Relisez nos articles pour en apprendre davantage."
              value={conclusion.text1}
              onChange={e => setConclusion(c => ({ ...c, text1: e.target.value }))}
              rows={3}
              required
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Score : 34% - 66% *
            </label>
            <textarea
              className="field w-full h-32 resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Pas mal ! Vous avez de bonnes bases."
              value={conclusion.text2}
              onChange={e => setConclusion(c => ({ ...c, text2: e.target.value }))}
              rows={3}
              required
            />
          </div>
          <div className="flex flex-col w-full">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Score : 67% - 100% *
            </label>
            <textarea
              className="field w-full h-32 resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Excellent ! Vous connaissez parfaitement le sujet !"
              value={conclusion.text3}
              onChange={e => setConclusion(c => ({ ...c, text3: e.target.value }))}
              rows={3}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizForm;