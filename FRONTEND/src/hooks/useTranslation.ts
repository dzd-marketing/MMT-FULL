import { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { getTranslation, subscribe } from '../utils/translator';

export const useTranslation = () => {
  const { language, setLanguage } = useContext(LanguageContext);
  const [, setTick] = useState(0);

  useEffect(() => {
    return subscribe(() => setTick(t => t + 1));
  }, []);

  const t = (text: string) => getTranslation(text, language);

  return { t, language, setLanguage };
};
