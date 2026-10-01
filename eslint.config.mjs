import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // docs/SHADCN-REFACTOR-PLAN.md Phase 7: app code should use components/ui
  // (Button, Input, SelectField, Textarea) instead of hand-styled form controls.
  // "warn" because a few bespoke surfaces (slot tiles, row buttons, avatar grid)
  // legitimately stay raw <button>s. Auth and landing run on their own neo-brutalist
  // style (--po-*) and are exempt, as is components/ui itself.
  {
    files: ["app/**/*.tsx", "components/**/*.tsx"],
    ignores: ["components/ui/**", "components/landing/**", "app/(auth)/**", "app/page.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXOpeningElement[name.name='button'] > JSXAttribute[name.name='className']",
          message: "Use <Button> from @/components/ui/button (or buttonVariants on a <Link>) instead of a hand-styled <button>.",
        },
        {
          selector: "JSXOpeningElement[name.name=/^(input|textarea|select)$/] > JSXAttribute[name.name='className']",
          message: "Use Input / Textarea / SelectField from @/components/ui instead of a hand-styled form control.",
        },
      ],
    },
  },
]);

export default eslintConfig;
