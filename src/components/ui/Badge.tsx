'use client';

import type { ReactNode, HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

export default function Badge({
  children,
  className = '',
  variant = 'default',
  size = 'sm',
  removable = false,
  onRemove,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-neutral-100 text-neutral-700',
    primary: 'bg-neutral-900 text-white',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    outline: 'bg-transparent border border-neutral-300 text-neutral-600',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label="Remove"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

// Tag input component for adding multiple tags
interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  label?: string;
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = 'Add tag...',
  suggestions = [],
  label,
}: TagInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !tags.includes(value)) {
        onTagsChange([...tags, value]);
        e.currentTarget.value = '';
      }
    } else if (e.key === 'Backspace' && !e.currentTarget.value && tags.length > 0) {
      onTagsChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const addSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      onTagsChange([...tags, suggestion]);
    }
  };

  const availableSuggestions = suggestions.filter((s) => !tags.includes(s));

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-neutral-300 rounded-lg focus-within:ring-2 focus-within:ring-neutral-500 focus-within:border-transparent">
        {tags.map((tag) => (
          <Badge key={tag} removable onRemove={() => removeTag(tag)}>
            {tag}
          </Badge>
        ))}
        <input
          type="text"
          placeholder={tags.length === 0 ? placeholder : ''}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[100px] outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
        />
      </div>
      {availableSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {availableSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addSuggestion(suggestion)}
              className="text-xs px-2 py-1 bg-neutral-50 text-neutral-600 rounded-full hover:bg-neutral-100 transition-colors"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
