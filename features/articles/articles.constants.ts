// Route constants
export const ARTICLE_ROUTES = {
  LIST: "/cms/articles",
  PREVIEW: (slug: string) => `/cms/articles/${slug}`,
  EDIT: (slug: string) => `/cms/articles/${slug}/edit`,
  NEW: "/cms/articles/new",
} as const;

// Labels and messages
export const ARTICLE_LABELS = {
  SAVE: "Save",
  PUBLISH: "Publish",
  UNPUBLISH: "Unpublish",
  PREVIEW: "Preview",
  DELETE: "Delete Article",
  BACK_TO_ARTICLES: "Back to Articles",
  SHOW_SETTINGS: "Show Settings",
  HIDE_SETTINGS: "Hide Settings",
  PREVIEW_ARTICLE: "Preview article",
} as const;

export const ARTICLE_STATUS = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  UNSAVED: "Unsaved",
  SAVED: "Saved",
} as const;

export const ARTICLE_MESSAGES = {
  SAVE_SUCCESS: "Changes saved",
  SAVE_SUCCESS_DESC: "Your article has been saved successfully",
  SAVE_ERROR: "Failed to save article",
  PUBLISH_SUCCESS: "Article published!",
  PUBLISH_SUCCESS_DESC: "Your article is now live",
  PUBLISH_ERROR: "Failed to publish article",
} as const;

// Editor settings
export const EDITOR_CONFIG = {
  WORDS_PER_MINUTE: 200,
  DESCRIPTION_MAX_LENGTH: 160,
} as const;
