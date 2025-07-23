import React, { createContext, useContext } from 'react';

interface DrawerContextType {
  openDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};

export const DrawerProvider: React.FC<{
  children: React.ReactNode;
  openDrawer: () => void;
}> = ({ children, openDrawer }) => {
  return (
    <DrawerContext.Provider value={{ openDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}; 