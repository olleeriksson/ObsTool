import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Relaxed — codebase has many `any`s; tighten in future phases
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'error',
      // React 16 class components legitimately use `{}` for empty props/state
      '@typescript-eslint/no-empty-object-type': 'off',
      // post-increment at end of sequence; harmless, addressed in future cleanup
      'no-useless-assignment': 'off',
    },
  },
  {
    ignores: ['build/**', 'node_modules/**', 'scripts/**'],
  },
)
