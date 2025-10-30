const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

module.exports = {
  extends: [
    "next/core-web-vitals",
    "eslint:recommended",
    "prettier",
    "eslint-config-turbo",
  ],
  parserOptions: {
    project,
  },
  globals: {
    React: true,
    JSX: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".next/",
    ".turbo/",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
};

