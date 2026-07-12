import React, { createContext, useContext, useState, useEffect } from 'react';

interface SchoolCodeContextType {
  selectedSchoolCode: string | null;
  setSelectedSchoolCode: (code: string | null) => void;
}

const SchoolCodeContext = createContext<SchoolCodeContextType | undefined>(undefined);

export function SchoolCodeProvider({ children }: { children: React.ReactNode }) {
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedSchoolCode');
    if (saved) {
      setSelectedSchoolCode(saved);
    }
  }, []);

  const handleSetSchoolCode = (code: string | null) => {
    setSelectedSchoolCode(code);
    if (code) {
      localStorage.setItem('selectedSchoolCode', code);
    } else {
      localStorage.removeItem('selectedSchoolCode');
    }
  };

  return (
    <SchoolCodeContext.Provider value={{ selectedSchoolCode, setSelectedSchoolCode: handleSetSchoolCode }}>
      {children}
    </SchoolCodeContext.Provider>
  );
}

export function useSchoolCode() {
  const context = useContext(SchoolCodeContext);
  if (!context) {
    throw new Error('useSchoolCode must be used within SchoolCodeProvider');
  }
  return context;
}
