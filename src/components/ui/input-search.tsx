import * as React from 'react';
import { SearchIcon, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Field } from '@/forms/forms';
import type { Resource } from '@/forms/make-resource';

export interface InputSearchProps {
  className?: string;
  control: Field<string>;
  resource?: Resource;
  placeholder?: string;
  disabled?: boolean;
  debounceMs?: number;
}

const InputSearch = React.forwardRef<
  HTMLInputElement,
  InputSearchProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputSearchProps>
>(({ className, control, resource, placeholder = "Search...", disabled, debounceMs = 300, ...props }, ref) => {
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(control.value.value || '');
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (resource && value.trim()) {
      timeoutRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await resource.fetch({ query: value });
          if (response.success) {
            setSuggestions(response.data);
            setShowSuggestions(true);
          }
        } catch (error) {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, debounceMs);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    const selectedValue = suggestion.title || suggestion.label || suggestion.value;
    control.value.value = selectedValue;
    setInputValue(selectedValue);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    control.value.value = '';
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
        <input
          ref={ref}
          type="text"
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          data-slot="input"
          className={cn(
            'pl-10 pr-10 py-2 h-9 w-full rounded-md border border-input bg-transparent text-sm shadow-xs transition-colors',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
            className
          )}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          {...props}
        />

        {/* Clear button */}
        {inputValue && !loading && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none p-0 cursor-pointer focus:outline-none"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear search"
            style={{ background: 'transparent', border: 'none', padding: 0 }}
          >
            <XIcon className="size-4" />
          </button>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="px-3 py-2 hover:bg-gray-100 hover:text-gray-900 cursor-pointer text-sm"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent input blur
                handleSuggestionClick(suggestion);
              }}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="font-medium">{suggestion.title || suggestion.label}</div>
              {suggestion.description && (
                <div className="text-xs text-gray-500">{suggestion.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

InputSearch.displayName = 'InputSearch';

export { InputSearch };
