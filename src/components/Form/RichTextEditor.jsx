import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const modules = {
  toolbar: [
    ['bold', 'italic'],
    ['link'],
    ['clean']
  ],
};

const formats = [
  'bold', 'italic', 'link'
];

function RichTextEditor({ value, onChange, placeholder, className, stripPTags = false }) {
  const [internalValue, setInternalValue] = useState(value || '');

  // Prevent infinite loop: only update internal state if the upstream value really changed 
  // (e.g. from a different item load or drag-and-drop), not just our space cleanup.
  useEffect(() => {
    if (!value) {
      if (internalValue) setInternalValue('');
      return;
    }

    // Apply the exact same cleaning to internalValue
    let cleanedInternal = internalValue.replace(/&nbsp;/g, ' ');
    cleanedInternal = cleanedInternal.replace(/<a\b([^>]*)>/gi, (match, attributes) => {
      if (!attributes.includes('target="_blank"')) {
        return `<a target="_blank" rel="noopener noreferrer"${attributes}>`;
      }
      return match;
    });

    if (stripPTags) {
      cleanedInternal = cleanedInternal.replace(/<\/p>\s*<p[^>]*>/gi, '<br><br>');
      cleanedInternal = cleanedInternal.replace(/<\/?p[^>]*>/gi, '');
    }

    if (value !== internalValue && value !== cleanedInternal) {
      setInternalValue(value);
    }
  }, [value, internalValue, stripPTags]);

  const handleChange = (content) => {
    setInternalValue(content);
    // Si le contenu est juste un paragraphe vide, on renvoie une chaîne vide
    if (content === '<p><br></p>' || content === '<p></p>') {
      if (onChange) onChange('');
      return;
    }

    // Replace non-breaking spaces with regular spaces to fix line-wrapping issues
    let cleanedContent = content.replace(/&nbsp;/g, ' ');

    // Ensure all links open in a new tab
    cleanedContent = cleanedContent.replace(/<a\b([^>]*)>/gi, (match, attributes) => {
      if (!attributes.includes('target="_blank"')) {
        return `<a target="_blank" rel="noopener noreferrer"${attributes}>`;
      }
      return match;
    });

    if (stripPTags) {
      // Replace <p> boundaries with <br><br> to preserve line breaks
      cleanedContent = cleanedContent.replace(/<\/p>\s*<p[^>]*>/gi, '<br><br>');
      // Strip all remaining <p> and </p> tags
      cleanedContent = cleanedContent.replace(/<\/?p[^>]*>/gi, '');
    }

    if (onChange) {
      onChange(cleanedContent);
    }
  };

  return (
    <div className={`rich-text-editor-wrapper bg-surface rounded-md border border-line overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-accent ${className || ''}`}>
      <style>{`
        .rich-text-editor-wrapper .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid var(--line);
          padding: 8px;
          background: var(--ground);
        }
        .rich-text-editor-wrapper .ql-container.ql-snow {
          border: none;
          min-height: 100px;
          font-family: inherit;
          font-size: 14px;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: 100px;
        }
        .rich-text-editor-wrapper .ql-editor a {
          color: var(--accent);
          font-weight: 700;
          text-decoration: underline;
        }
      `}</style>
      <ReactQuill 
        theme="snow" 
        value={internalValue} 
        onChange={handleChange} 
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}

export default RichTextEditor;
