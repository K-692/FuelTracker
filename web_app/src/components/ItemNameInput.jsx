import React, { useId, useMemo, useState } from 'react';
import { filterItemSuggestions } from '../domain/serviceItems';

/**
 * Text input that suggests service-item names the user has used before
 * (current items + names from past service records). Works with touch and keyboard.
 */
export function ItemNameInput({ value, onChange, onPick, onEnter, suggestions = [], placeholder, ariaLabel, style, autoFocus = false, inputId }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  const matches = useMemo(() => filterItemSuggestions(suggestions, value), [suggestions, value]);
  const showList = open && matches.length > 0;

  const pick = (s) => {
    onChange(s.name);
    setOpen(false);
    setActive(-1);
    onPick?.(s);
  };

  const onKeyDown = (e) => {
    if (showList && e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(matches.length - 1, i + 1)); return; }
    if (showList && e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(-1, i - 1)); return; }
    if (e.key === 'Escape' && showList) { e.stopPropagation(); setOpen(false); return; }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showList && active >= 0) pick(matches[active]);
      else { setOpen(false); onEnter?.(); }
    }
  };

  return (
    <div className="suggest-wrap" style={style}>
      <input
        type="text"
        id={inputId}
        autoFocus={autoFocus}
        className="form-input"
        value={value}
        maxLength={60}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="suggest-list" id={listId} role="listbox">
          {matches.map((s, i) => (
            <li
              key={s.name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'is-active' : ''}
              onMouseDown={(e) => { e.preventDefault(); pick(s); }}
            >
              <span className="suggest-name">{s.name}</span>
              <span className="suggest-meta">
                {s.inList ? 'In your items' : 'Used before'}{s.count > 0 ? ` • ${s.count}×` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
