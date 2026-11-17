import nextConfig from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

export default [
  ...nextConfig,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "coverage/**"],
    rules: {
      // Existing generated UI primitives use these established patterns; keep
      // them visible in CI without blocking the production build.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-this-alias": "warn",
    },
  },
]
