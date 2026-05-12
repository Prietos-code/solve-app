import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Language = "es" | "en";

const translations = {
  es: {
    // Navigation
    settings: "Ajustes",
    profile: "Tu perfil",

    // Settings sections
    language: "Idioma",
    notifications: "Notificaciones",
    privacy: "Privacidad",
    timezone: "Zona horaria",
    account: "Cuenta",
    about: "Sobre la app",

    // Language
    languageDesc: "Selecciona el idioma de la aplicación",
    spanish: "Español",
    english: "English",

    // Notifications
    pushNotifications: "Notificaciones push",
    pushNotificationsDesc: "Recibe alertas sobre nuevas tareas y mensajes",
    emailNotifications: "Notificaciones por email",
    emailNotificationsDesc: "Resumen diario de actividad en tu correo",
    smsNotifications: "Notificaciones SMS",
    smsNotificationsDesc: "Alertas urgentes por mensaje de texto",

    // Privacy
    publicProfile: "Perfil público",
    publicProfileDesc: "Otros usuarios pueden ver tu perfil y valoraciones",
    showDistance: "Mostrar distancia",
    showDistanceDesc: "Ver tu ubicación aproximada a otros usuarios",

    // Timezone
    timezoneDesc: "Selecciona tu zona horaria",
    madrid: "Madrid (GMT+1)",
    paris: "París (GMT+1)",
    berlin: "Berlín (GMT+1)",
    london: "Londres (GMT+0)",

    // Account
    changePassword: "Cambiar contraseña",
    changePasswordDesc: "Actualiza tu contraseña de acceso",
    deleteAccount: "Eliminar cuenta",
    deleteAccountDesc: "Borra tu cuenta y todos tus datos de forma permanente",
    exportData: "Exportar datos",
    exportDataDesc: "Descarga una copia de todos tus datos",

    // About
    version: "Versión",
    terms: "Términos y condiciones",
    privacyPolicy: "Política de privacidad",
    helpSupport: "Ayuda y soporte",

    // Actions
    save: "Guardar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    delete: "Eliminar",

    // Alerts
    confirmDelete: "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.",
    accountDeleted: "Cuenta eliminada correctamente",
  },
  en: {
    // Navigation
    settings: "Settings",
    profile: "Your profile",

    // Settings sections
    language: "Language",
    notifications: "Notifications",
    privacy: "Privacy",
    timezone: "Timezone",
    account: "Account",
    about: "About",

    // Language
    languageDesc: "Select the application language",
    spanish: "Español",
    english: "English",

    // Notifications
    pushNotifications: "Push notifications",
    pushNotificationsDesc: "Receive alerts about new tasks and messages",
    emailNotifications: "Email notifications",
    emailNotificationsDesc: "Daily activity summary in your email",
    smsNotifications: "SMS notifications",
    smsNotificationsDesc: "Urgent alerts via text message",

    // Privacy
    publicProfile: "Public profile",
    publicProfileDesc: "Other users can view your profile and reviews",
    showDistance: "Show distance",
    showDistanceDesc: "Show your approximate location to other users",

    // Timezone
    timezoneDesc: "Select your timezone",
    madrid: "Madrid (GMT+1)",
    paris: "Paris (GMT+1)",
    berlin: "Berlin (GMT+1)",
    london: "London (GMT+0)",

    // Account
    changePassword: "Change password",
    changePasswordDesc: "Update your access password",
    deleteAccount: "Delete account",
    deleteAccountDesc: "Permanently delete your account and all your data",
    exportData: "Export data",
    exportDataDesc: "Download a copy of all your data",

    // About
    version: "Version",
    terms: "Terms and conditions",
    privacyPolicy: "Privacy policy",
    helpSupport: "Help and support",

    // Actions
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",

    // Alerts
    confirmDelete: "Are you sure you want to delete your account? This action cannot be undone.",
    accountDeleted: "Account deleted successfully",
  },
} as const;

type TranslationKey = keyof (typeof translations)["es"];

interface TranslationContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

const STORAGE_KEY = "solve_lang";

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(STORAGE_KEY) as Language) || "es";
    }
    return "es";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}
