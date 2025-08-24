export const i18n = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      loading: 'Loading...',
    },
  },
  es: {
    common: {
      save: 'Guardar',
      cancel: 'Cancelar', 
      delete: 'Eliminar',
      loading: 'Cargando...',
    },
  },
} as const;

export type TranslationKey = keyof typeof i18n.en;