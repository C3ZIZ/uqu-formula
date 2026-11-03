// Lint rules: Next.js defaults plus a required short comment on every named function.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import jsdoc from "eslint-plugin-jsdoc";

export default [
  { ignores: [".next/**", "node_modules/**", "src/db/migrations/**", "next-env.d.ts", ".superpowers/**"] },
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.ts", "loadtest/**/*.{ts,js}"],
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: false,
          require: { FunctionDeclaration: true, MethodDefinition: true, ArrowFunctionExpression: false },
          contexts: ["VariableDeclaration > VariableDeclarator > ArrowFunctionExpression"],
        },
      ],
    },
  },
];
