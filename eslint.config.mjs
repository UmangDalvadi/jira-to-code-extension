import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [{
    files: ["**/*.ts"],
}, {
    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",
    },

    rules: {
    "@typescript-eslint/naming-convention": ["warn", {
        selector: "import",
        format: ["camelCase", "PascalCase"],
    }],

    curly: "warn",
    eqeqeq: "warn",
    "no-throw-literal": "warn",
    semi: "warn",

    // 🔥 new rules
    "no-unused-vars": "warn",
    "no-console": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "import/order": ["warn", {
        "groups": ["builtin", "external", "internal"],
        "alphabetize": { "order": "asc", "caseInsensitive": true }
    }]
}

}];