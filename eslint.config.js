import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
js.configs.recommended,
{
files: ['/*.ts', '/.tsx'],
extends: [
...tseslint.configs.recommended,
],
languageOptions: {
parser: tseslint.parser,
parserOptions: {
project: path.resolve(__dirname, 'frontend/tsconfig.json'),
tsconfigRootDir: __dirname,
},
},
rules: {
'no-unused-vars': 'warn',
'no-console': 'warn',
'@typescript-eslint/no-unused-vars': 'warn',
'@typescript-eslint/no-explicit-any': 'warn',
'@typescript-eslint/no-empty-function': 'warn',
},
},
{
files: [
'**/.js',
'eslint.config.js',
],
languageOptions: {
globals: {
__dirname: 'readonly',
__filename: 'readonly',
},
},
rules: {
'no-console': 'warn',
},
},
];