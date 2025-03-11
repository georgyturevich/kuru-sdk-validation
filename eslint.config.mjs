import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        ignores: [
            // Build outputs
            'dist/',
            'build/',
            
            // Node modules
            'node_modules/',
            
            // Coverage reports
            'coverage/',
            
            // Configs
            'eslint.config.mjs',
            '.prettierrc.js',
            'jest.config.js',
            
            // Package lock
            'package-lock.json'
        ]
    }
);
