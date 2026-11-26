
const js = require("@eslint/js");

module.exports = [
  {
    ignores: ["node_modules/**", "dist/**"],
  },

  js.configs.recommended,

  // Archivos normales de la API: CommonJS
  {
    files: ["**/*.js"],
    ignores: ["tests/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },

  // Archivos de pruebas: ES Modules
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
];
