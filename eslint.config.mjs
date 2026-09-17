import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Round 114 follow-up, Finding 4 (extended) — Peter's standing rule:
// nothing the user does may leave the screen unchanged while the app
// waits on anything. src/lib/http/apiRequest.ts (the one exempted call
// site — it has no "use client" directive, so this rule doesn't even
// look at it) is the only place a raw fetch() belongs; every client
// component reaching an internal API route goes through it instead,
// which is what actually enforces the real timeout every such call
// needs. A glob-based ESLint override can't reliably tell client
// components apart from Server Components/API routes living in the same
// src/app directories (both use the .tsx/.ts extension), so this checks
// the file's own "use client" directive directly instead.
const noRawFetchInClientComponents = {
  rules: {
    "no-raw-fetch-in-client-components": {
      create(context) {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const program = sourceCode.ast;
        const isClientComponent = program.body.some(
          (node) =>
            node.type === "ExpressionStatement" &&
            node.expression.type === "Literal" &&
            node.expression.value === "use client"
        );
        if (!isClientComponent) return {};
        return {
          "CallExpression[callee.name='fetch']"(node) {
            context.report({
              node,
              message:
                "Raw fetch() in a client component. Use apiRequest() from @/lib/http/apiRequest instead, so this call gets a real timeout (Round 114 follow-up, Finding 4 -- see CLOUD_CLAUDE.md).",
            });
          },
        };
      },
    },
  },
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { local: noRawFetchInClientComponents },
    rules: {
      "local/no-raw-fetch-in-client-components": "error",
    },
  },
];

export default eslintConfig;
