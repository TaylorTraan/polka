import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormattingState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: string;
  fontFamily: string;
  textColor: string;
  highlightColor: string;
  alignment: 'left' | 'center' | 'right';
  listType: 'none' | 'bullet' | 'ordered';
}

interface FormattingContextType {
  formatting: FormattingState;
  updateFormatting: (updates: Partial<FormattingState>) => void;
  resetFormatting: () => void;
}

const defaultFormatting: FormattingState = {
  bold: false,
  italic: false,
  underline: false,
  fontSize: '16px',
  fontFamily: 'Arial, sans-serif',
  textColor: '#000000',
  highlightColor: 'transparent',
  alignment: 'left',
  listType: 'none'
};

const FormattingContext = createContext<FormattingContextType | undefined>(undefined);

export function FormattingProvider({ children }: { children: ReactNode }) {
  const [formatting, setFormatting] = useState<FormattingState>(defaultFormatting);

  const updateFormatting = (updates: Partial<FormattingState>) => {
    setFormatting(prev => ({ ...prev, ...updates }));
  };

  const resetFormatting = () => {
    setFormatting(defaultFormatting);
  };

  return (
    <FormattingContext.Provider value={{ formatting, updateFormatting, resetFormatting }}>
      {children}
    </FormattingContext.Provider>
  );
}

export function useFormatting() {
  const context = useContext(FormattingContext);
  if (context === undefined) {
    throw new Error('useFormatting must be used within a FormattingProvider');
  }
  return context;
}
