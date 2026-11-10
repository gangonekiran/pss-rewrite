import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    restoreMocks: true,
    exclude: [...configDefaults.exclude, "dist/**/*.*"],
    coverage: {
      enabled: true,
      include: ["src/**/*.ts"],
      exclude: [
        "dist/**/*.*",
        "src/**/*.config.ts",
        "src/**/*.types.ts",
        "src/auth/interfaces/*.ts",
        "src/auth/models/*.ts",
        "src/types/express.d.ts",
        "src/config/database.ts",
        "src/config/swagger.ts",
        "src/app.ts",
        "src/server.ts",
      ],
    },
  },
});
