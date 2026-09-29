import { createContext } from 'react';
import type { PageContextValue } from '../types';

const defaultPageContext: PageContextValue = {
  currentPage: 0,
  setCurrentPage: () => {},
};

export const PageContext = createContext<PageContextValue>(defaultPageContext);
