import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import './LocationAutocomplete.css';

const DEBOUNCE_MS = 350;

/**
 * Searchable location input with optional suggestions (OpenCage via backend).
 * User can always keep typing manually — selection is optional.
 */
export default function LocationAutocomplete({
  id,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  className = '',
  inputClassName = '',
  autoComplete = 'off',
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const wrapperRef = useRef(null);
  const blurTimer = useRef(null);

  useEffect(() => {
    const q = (value || '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      return undefined;
    }

    const t = setTimeout(async () => {
      try {
        const { data } = await axiosInstance.get('/api/locations/suggest', {
          params: { q },
        });
        const list = Array.isArray(data?.suggestions) ? data.suggestions : [];
        setSuggestions(list);
        setOpen(list.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [value]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback((label) => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    const syntheticEvent = {
      target: { name, value: label },
    };
    onChange(syntheticEvent);
    setOpen(false);
    setSuggestions([]);
  }, [name, onChange]);

  const handleInputChange = useCallback((e) => {
    onChange(e);
  }, [onChange]);

  const handleInputBlur = useCallback(() => {
    blurTimer.current = window.setTimeout(() => {
      closeDropdown();
      if (typeof onBlur === 'function') {
        const ev = {
          target: { name },
        };
        onBlur(ev);
      }
    }, 150);
  }, [closeDropdown, onBlur, name]);

  const handleInputFocus = useCallback(() => {
    if (blurTimer.current) window.clearTimeout(blurTimer.current);
    if (suggestions.length > 0) setOpen(true);
    if (typeof onFocus === 'function') {
      onFocus({ target: { name } });
    }
  }, [suggestions.length, onFocus, name]);

  useEffect(() => {
    function handleDocClick(e) {
      if (!wrapperRef.current || wrapperRef.current.contains(e.target)) return;
      closeDropdown();
    }
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [closeDropdown]);

  return (
    <div className={`location-autocomplete ${className}${error ? ' location-autocomplete--error' : ''}`} ref={wrapperRef}>
      <input
        id={id}
        type="text"
        name={name}
        autoComplete={autoComplete}
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
      />
      {open && suggestions.length > 0 && (
        <ul className="location-autocomplete__list" role="listbox">
          {suggestions.map((s, idx) => (
            <li key={`${s.label}-${idx}`} role="presentation">
              <button
                type="button"
                tabIndex={-1}
                className="location-autocomplete__option"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s.label);
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
