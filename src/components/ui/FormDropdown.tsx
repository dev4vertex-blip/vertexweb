import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface FormDropdownProps {
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  options: DropdownOption[];
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  searchable?: boolean;
  className?: string;
}

export const FormDropdown: React.FC<FormDropdownProps> = ({
  id,
  name,
  label,
  required = false,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  error,
  helperText,
  searchable = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Filter options if searchable
  const filteredOptions = searchable || options.length > 7
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options;

  // Detect theme (dark vs light) dynamically
  useEffect(() => {
    const detectDark = () => {
      if (typeof document === 'undefined') return;
      const isHtmlDark = document.documentElement.classList.contains('dark');
      const isBodyDark = document.body.classList.contains('dark');
      const isRootDark = document.getElementById('root')?.classList.contains('dark');
      const isTriggerInDark = triggerRef.current?.closest('.dark') !== null;
      const isSystemDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setIsDarkTheme(isHtmlDark || isBodyDark || !!isRootDark || isTriggerInDark || !!isSystemDark);
    };

    detectDark();
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(detectDark);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      if (document.body) {
        observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      }
      return () => observer.disconnect();
    }
  }, []);

  // Compute position relative to viewport so parent overflow never clips
  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    // If trigger has been scrolled completely off-screen, close menu
    if (typeof window !== 'undefined' && (rect.bottom < 0 || rect.top > window.innerHeight)) {
      setIsOpen(false);
      return;
    }

    const menuEstimatedHeight = Math.min(filteredOptions.length * 44 + 60, 280);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuEstimatedHeight && rect.top > menuEstimatedHeight;

    const computedWidth = rect.width > 0 ? rect.width : (triggerRef.current.offsetWidth || 240);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - computedWidth - 8));
    const top = placeAbove ? rect.top - 6 : rect.bottom + 6;

    setCoords({
      top,
      left,
      width: computedWidth,
      placeAbove,
    });
  }, [filteredOptions.length]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      setSearchTerm('');
      setHighlightedIndex(-1);

      const handleScrollOrResize = () => {
        updateCoords();
      };

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          triggerRef.current && !triggerRef.current.contains(target) &&
          menuRef.current && !menuRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
      document.addEventListener('mousedown', handleClickOutside);

      // Focus search input after animation frame if searchable
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);

      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
        document.removeEventListener('mousedown', handleClickOutside);
        clearTimeout(timer);
      };
    }
  }, [isOpen, updateCoords]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        updateCoords();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            onChange(String(opt.value));
            setIsOpen(false);
            triggerRef.current?.focus();
          }
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (val: string | number, disabledOpt?: boolean) => {
    if (disabledOpt) return;
    onChange(String(val));
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const maxMenuHeight = coords.placeAbove
    ? Math.min(288, Math.max(140, coords.top - 20))
    : Math.min(288, Math.max(140, (typeof window !== 'undefined' ? window.innerHeight : 600) - coords.top - 20));

  const dropdownMenu = isOpen && typeof document !== 'undefined' ? (
    createPortal(
      <div
        ref={menuRef}
        id={id ? `${id}-menu` : undefined}
        role="listbox"
        style={{
          position: 'fixed',
          top: coords.placeAbove ? 'auto' : `${coords.top}px`,
          bottom: coords.placeAbove ? `${Math.max(8, (typeof window !== 'undefined' ? window.innerHeight : 600) - coords.top)}px` : 'auto',
          left: `${coords.left}px`,
          width: `${Math.max(coords.width, 220)}px`,
          maxHeight: `${maxMenuHeight}px`,
          zIndex: 99999,
        }}
        className={`rounded-xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col ${
          isDarkTheme
            ? 'dark bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/80'
            : 'bg-white border-slate-300 text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* Search Header for longer option lists */}
        {(searchable || options.length > 7) && (
          <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/90 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder="Search..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 dark:focus:ring-indigo-500 dark:focus:border-indigo-500"
                onKeyDown={handleKeyDown}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Options List */}
        <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1 max-h-60">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-xs text-center text-slate-500 dark:text-slate-400 font-medium">
              No matching options found
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = highlightedIndex === idx;

              return (
                <button
                  key={opt.value}
                  id={id ? `${id}-option-${opt.value}` : undefined}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600'
                      : isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isHighlighted
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div
                        className={`text-[10px] font-normal truncate mt-0.5 ${
                          isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {opt.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5 uppercase tracking-wide"
        >
          {label} {required && <span className="text-rose-600 dark:text-rose-400">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Visible Accessible Trigger Button */}
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`w-full px-3.5 py-2.5 text-sm font-semibold text-left rounded-lg border transition-all flex items-center justify-between cursor-pointer shadow-xs ${
            disabled
              ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
              : error
              ? 'bg-white text-slate-900 border-rose-400 focus:ring-2 focus:ring-rose-200 dark:bg-slate-900 dark:text-slate-100 dark:border-rose-500'
              : isOpen
              ? 'bg-white text-slate-900 border-indigo-600 ring-2 ring-indigo-100 dark:bg-slate-900 dark:text-slate-100 dark:border-indigo-400 dark:ring-indigo-950/60'
              : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:border-slate-600 dark:focus:ring-indigo-500 dark:focus:border-indigo-500'
          }`}
        >
          <span className="truncate pr-2">
            {selectedOption ? (
              <span className="text-slate-900 dark:text-slate-100">{selectedOption.label}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 font-normal">{placeholder}</span>
            )}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 text-slate-500 dark:text-slate-400">
            {selectedOption?.badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 uppercase">
                {selectedOption.badge}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-150 ${
                isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          </div>
        </button>

        {/* Hidden synced native select for accessibility and forms */}
        <select
          name={name}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {dropdownMenu}

      {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{helperText}</p>}
    </div>
  );
};
