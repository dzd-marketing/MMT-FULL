let pending: string[] = [];
let timer: any = null;
const cache: Record<string, string> = {};
let listeners: Array<() => void> = [];

export const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const notify = () => listeners.forEach(l => l());

export const getTranslation = (text: string, lang: string): string => {
  if (lang === 'en' || !text) return text;
  
  const key = `${lang}:${text}`;
  if (cache[key]) return cache[key];

  if (!pending.includes(text)) {
    pending.push(text);
  }

  if (!timer) {
    timer = setTimeout(() => {
      const textsToTranslate = [...pending];
      pending = [];
      timer = null;

      if (textsToTranslate.length === 0) return;

      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: textsToTranslate, to: lang })
      })
      .then(res => res.json())
      .then(data => {
        if (data.translations) {
          textsToTranslate.forEach((t, i) => {
            cache[`${lang}:${t}`] = data.translations[i];
          });
          notify();
        }
      })
      .catch(console.error);
    }, 100);
  }

  return text; // return English while loading
};
