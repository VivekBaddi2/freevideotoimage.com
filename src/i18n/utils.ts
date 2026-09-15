import { ui, defaultLang, showDefaultLang, languages, type SupportedLanguage } from './ui';

export function getLangFromUrl(url: URL): SupportedLanguage {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in languages) {
    return lang as SupportedLanguage;
  }
  return defaultLang;
}

export function useTranslations(lang: SupportedLanguage) {
  return function t(key: keyof typeof ui[typeof defaultLang]): string {
    return ui[lang]?.[key] || ui[defaultLang][key] || key;
  };
}

export function useTranslatedPath(lang: SupportedLanguage) {
  return function translatePath(path: string, l: SupportedLanguage = lang): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    // Strip leading language tag if already present
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments[0] && segments[0] in languages) {
      segments.shift();
    }
    const purePath = '/' + segments.join('/');

    if (!showDefaultLang && l === defaultLang) {
      return purePath === '' ? '/' : purePath;
    }
    return `/${l}${purePath === '/' ? '' : purePath}`;
  };
}

export interface AlternateHreflang {
  lang: string;
  hreflang: string;
  href: string;
}

export function getAlternateUrls(siteUrl: string, pathname: string): AlternateHreflang[] {
  // Strip trailing slash if present (except root)
  const origin = siteUrl.replace(/\/$/, '');

  // Extract base route without language prefix
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] && segments[0] in languages) {
    segments.shift();
  }
  const purePath = '/' + segments.join('/');
  const normalizedPath = purePath === '/' ? '' : purePath;

  const alternates: AlternateHreflang[] = (Object.keys(languages) as SupportedLanguage[]).map((lang) => {
    const localizedPath = !showDefaultLang && lang === defaultLang
      ? `${origin}${normalizedPath || '/'}`
      : `${origin}/${lang}${normalizedPath}`;

    return {
      lang,
      hreflang: lang,
      href: localizedPath,
    };
  });

  // Add x-default pointing to the default language (English)
  alternates.push({
    lang: 'x-default',
    hreflang: 'x-default',
    href: `${origin}${normalizedPath || '/'}`,
  });

  return alternates;
}
