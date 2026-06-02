import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export type MosaicLocale = "en" | "fr";

let initialized = false;

export function initMosaicI18n(defaultLocale: MosaicLocale = "en") {
  if (initialized) return i18n;
  i18n.use(initReactI18next).init({
    resources: {
      en: { mosaic: en },
      fr: { mosaic: fr },
    },
    lng: defaultLocale,
    fallbackLng: "en",
    defaultNS: "mosaic",
    ns: ["mosaic"],
    interpolation: { escapeValue: false },
  });
  initialized = true;
  return i18n;
}

export { i18n };
