import React, { useState, useEffect } from 'react';
import factsIcons from '../../data/factsIcons.json';
import ImageUploader from '../ImageUploader';
import RepeatableBlockActions from './RepeatableBlockActions';
import RichTextEditor from './RichTextEditor';

function FactsForm({ currentEmbed, formMode, onChange }) {
  const [rencontre, setRencontre] = useState('');
  const [date, setDate] = useState('');
  const [items, setItems] = useState([
    { id: Date.now() + '-0', icon: factsIcons[0]?.id || '', title: "L'action de la soirée", type: 'normal', text: '', votes: 0 }
  ]);

  // Brand & theme (rubrique)
  const [brand, setBrand] = useState('blick');
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    if (formMode === 'edit' && currentEmbed) {
      setBrand(currentEmbed.brand || 'blick');
      setTheme(currentEmbed.theme || null);

      if (currentEmbed.factsData) {
        setRencontre(currentEmbed.factsData.rencontre || '');
        
        if (currentEmbed.factsData.date) {
          const timestamp = currentEmbed.factsData.date;
          let dateString = '';
          if (timestamp?.toDate) {
            dateString = timestamp.toDate().toISOString().slice(0, 10);
          } else if (typeof timestamp === 'string') {
            dateString = timestamp.slice(0, 10);
          }
          setDate(dateString);
        }
        
        let loadedItems = [];
        if (Array.isArray(currentEmbed.factsData.items)) {
           loadedItems = currentEmbed.factsData.items.map((item, index) => ({
               id: `legacy-${currentEmbed.id}-${index}`,
               ...item
           }));
        } else if (currentEmbed.factsData.items && typeof currentEmbed.factsData.items === 'object') {
           const keys = Object.keys(currentEmbed.factsData.items).filter(k => !isNaN(k)).sort();
           loadedItems = keys.map((k, index) => ({
               id: `legacy-${currentEmbed.id}-${index}`,
               ...currentEmbed.factsData.items[k]
           }));
        } else {
          let i = 1;
          while (currentEmbed.factsData[`item${i}`]) {
            loadedItems.push({
              id: `legacy-${currentEmbed.id}-${i}`,
              ...currentEmbed.factsData[`item${i}`]
            });
            i++;
          }
        }
        
        if (loadedItems.length > 0) {
          setItems(loadedItems);
        }
      }
    }
  }, [formMode, currentEmbed]);

  useEffect(() => {
    const hasRating = items.some(item => item.type === 'rating');
    const update = {
      factsData: {
        rencontre,
        date,
        items
      },
      type: 'facts',
      brand,
      theme
    };

    if (hasRating) {
      // Use existing ratingStats (or legacy voteStats) if available, otherwise initialize
      update.ratingStats = currentEmbed?.ratingStats || currentEmbed?.voteStats || {
        "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "10": 0
      };
    } else {
      // Explicitly set to null if it existed but the rating item was removed
      if (currentEmbed?.ratingStats || currentEmbed?.voteStats) {
        update.ratingStats = null;
      }
    }

    onChange(update);
  }, [rencontre, date, items, brand, theme, onChange, currentEmbed]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now() + '-' + items.length, icon: factsIcons[0]?.id || '', title: "L'action de la soirée", type: 'normal', text: '', votes: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleTypeChange = (index, newType) => {
    const defaultIcons = {
      normal: 'iconCross',
      picture: 'iconEye',
      quote: 'iconQuote',
      number: 'iconHashtag',
      rating: 'iconCheck'
    };
    
    const defaultTitles = {
      normal: "L'action de la soirée",
      quote: "La phrase de la soirée",
      picture: "L'image de la soirée",
      number: "Le chiffre de la soirée",
      rating: "Et vous, comment noteriez-vous cette rencontre?"
    };
    
    const newItems = [...items];
    newItems[index].type = newType;
    newItems[index].icon = defaultIcons[newType] || 'iconCross';
    
    // Auto-complete the title based on type selection
    newItems[index].title = defaultTitles[newType] || "L'action de la soirée";
    
    setItems(newItems);
  };

  const moveItemUp = (index) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
  };

  const moveItemDown = (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
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
            <label className="flex items-center gap-2 cursor-not-allowed opacity-50 select-none" title="Le module de faits marquants n'est pas encore compatible avec la brand PME.">
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

      {/* Section 1: Rencontre et Date */}
      <div className="flex gap-4">
        {/* Rencontre */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rencontre *
          </label>
          <input
            type="text"
            value={rencontre}
            onChange={(e) => setRencontre(e.target.value)}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Ajoie - Lausanne"
            required
          />
        </div>

        {/* Date */}
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            required
          />
        </div>
      </div>

      {/* Section 2: Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Faits marquants *
        </label>
        <div>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="bg-gray-50 border border-gray-300 rounded-md overflow-hidden">
                
                <RepeatableBlockActions 
                  index={index}
                  total={items.length}
                  onMoveUp={moveItemUp}
                  onMoveDown={moveItemDown}
                  onRemove={handleRemoveItem}
                  title={`Fait marquant ${index + 1}`}
                />

                <div className="p-4">
                {/* Line 1 - Type & Icons */}
                <div className="flex gap-4 mb-3">
                  <div className={item.type === 'rating' ? 'w-full' : 'w-1/2'}>
                     <label className="block text-xs font-medium text-gray-500 mb-1">Type *</label>
                     <select
                        value={item.type}
                        onChange={(e) => handleTypeChange(index, e.target.value)}
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                     >
                       <option value="normal">Normal</option>
                       <option value="quote">Citation</option>
                       <option value="picture">Image</option>
                       <option value="number">Chiffre</option>
                       <option value="rating" disabled={items.some((it, i) => it.type === 'rating' && i !== index)}>Note du match</option>
                     </select>
                  </div>
                  {item.type !== 'rating' && (
                    <div className="w-1/2">
                     <label className="block text-xs font-medium text-gray-500 mb-1">Icône</label>
                     <div className="flex flex-wrap gap-2">
                       {factsIcons.map(icon => (
                          <button
                            key={icon.id}
                            type="button"
                            onClick={() => handleItemChange(index, 'icon', icon.id)}
                            className={`w-[48px] h-[48px] p-2 border rounded-md transition-colors flex items-center justify-center ${item.icon === icon.id ? 'border-[#e20000] bg-[#e20000]/10 text-[#e20000]' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                            title={icon.name}
                            dangerouslySetInnerHTML={{ __html: icon.svg }}
                          />
                       ))}
                     </div>
                    </div>
                  )}
                </div>

                 {/* Line 2 - Titre */}
                <div className="mb-3">
                     <label className="block text-xs font-medium text-gray-500 mb-1">
                       {item.type === 'rating' ? 'Question posée *' : 'Titre *'}
                     </label>
                     <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                        className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder={item.type === 'rating' ? "Qui a été le meilleur joueur?" : "L'action de la soirée"}
                        required
                     />
                </div>

                {/* Line 2 */}
                {item.type !== 'number' && item.type !== 'rating' && (
                  <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">
                       {item.type === 'quote' ? 'Citation *' : 'Contenu *'}
                     </label>
                     <RichTextEditor
                        value={item.text}
                        onChange={(val) => handleItemChange(index, 'text', val)}
                        placeholder="Contenu..."
                        stripPTags={item.type === 'quote'}
                     />
                  </div>
                )}
                
                {/* Conditionals based on item.type */}
                {item.type === 'quote' && (
                  <div className="mt-4 space-y-4">
                     <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">Auteur de la citation *</label>
                       <input
                          type="text"
                          value={item.author || ''}
                          onChange={(e) => handleItemChange(index, 'author', e.target.value)}
                          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="– Geoff Ward, entraîneur du LHC"
                          required
                       />
                     </div>
                     <div>
                       <ImageUploader
                         type="facts"
                         initialUrl={item.picture || ''}
                         oldUrl={formMode === 'edit' ? (item.picture || '') : ''}
                         label="Personne détourée (Optionnel)"
                         disabled={false}
                         onUpload={(url) => handleItemChange(index, 'picture', url)}
                       />
                     </div>
                  </div>
                )}
                {item.type === 'picture' && (
                  <div className="mt-4 space-y-4">
                     <div>
                       <label className="block text-xs font-medium text-gray-500 mb-1">Crédit *</label>
                       <input
                          type="text"
                          value={item.caption || ''}
                          onChange={(e) => handleItemChange(index, 'caption', e.target.value)}
                          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Photo: Getty Images"
                          required
                       />
                     </div>
                     <div>
                       <ImageUploader
                         type="facts"
                         initialUrl={item.src || ''}
                         oldUrl={formMode === 'edit' ? (item.src || '') : ''}
                         label="Image *"
                         disabled={false}
                         onUpload={(url) => handleItemChange(index, 'src', url)}
                       />
                     </div>
                  </div>
                )}
                {item.type === 'number' && (
                  <div className="flex gap-4 mt-3">
                     <div className="w-1/4">
                       <label className="block text-xs font-medium text-gray-500 mb-1">Le chiffre *</label>
                       <input
                          type="number"
                          value={item.value !== undefined ? item.value : ''}
                          onChange={(e) => handleItemChange(index, 'value', e.target.value ? parseInt(e.target.value, 10) : '')}
                          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="16"
                          required
                       />
                     </div>
                     <div className="w-3/4">
                       <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
                       <input
                          type="text"
                          value={item.text || ''}
                          onChange={(e) => handleItemChange(index, 'text', e.target.value)}
                          className="field mb-0 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="Le nombre de minutes jouées..."
                          required
                       />
                     </div>
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-blick hover:underline text-sm mt-4 font-medium flex items-center"
          >
            + Ajouter un fait marquant
          </button>
        </div>
      </div>
    </div>
  );
}

export default FactsForm;
