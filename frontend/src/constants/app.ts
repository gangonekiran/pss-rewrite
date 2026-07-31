export const APP = {
  // Company
  COMPANY_NAME: "Pushpa Software Solutions",
  PROJECT_NAME: "PSS Rewrite",

  // Version
  VERSION: "1.0.0",
  BUILD_NUMBER: "1001",

  // Environment
  ENVIRONMENT: import.meta.env.MODE,
  API_VERSION: "v1",

  // Default Settings
  DEFAULT_LANGUAGE: "en",
  DEFAULT_THEME: "light",

  // Assets
  COMPANY_LOGO: "/logos/logo.svg",
  LOGIN_BACKGROUND: "/images/login-bg.jpg",

  // Header
  HEADER_TITLE: "PSS Rewrite",
  HEADER_SUBTITLE: "Enterprise Management System",
  WELCOME_MESSAGE: "Welcome",

  // Footer
  COPYRIGHT: `© ${new Date().getFullYear()} Pushpa Software Solutions. All Rights Reserved.`,
  FOOTER_TEXT: "Powered by Pushpa Software Solutions",

  // Contact
  WEBSITE: "https://www.pushpasoftwaresolutions.in",
  SUPPORT_EMAIL: "support@pushpasoftwaresolutions.in",
} as const;