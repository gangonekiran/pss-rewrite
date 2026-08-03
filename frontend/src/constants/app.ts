
import logo from "../assets/logos/svg.png";

export const APP = {
  // Company
  COMPANY_NAME: "Test",
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
  COMPANY_LOGO: logo,
  LOGIN_BACKGROUND: "/images/login-bg.jpg",

  // Header
  HEADER_TITLE: "Header Title",
  HEADER_SUBTITLE: "Enterprise Management System",
  WELCOME_MESSAGE: "Welcome",

  // Footer
  COPYRIGHT: `© ${new Date().getFullYear()} Test. All Rights Reserved.`,
  FOOTER_TEXT: "Powered by Test",

  // Contact
  WEBSITE: "https://www.test.in",
  SUPPORT_EMAIL: "support@test.in",
} as const;