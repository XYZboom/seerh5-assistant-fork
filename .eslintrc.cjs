module.exports = {
    env: {
        browser: true,
        es2022: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: [
            './packages/launcher/tsconfig.json',
            './packages/core/tsconfig.json',
            './packages/server/tsconfig.json',
        ],
    },
    plugins: ['@typescript-eslint'],
    ignorePatterns: ['types', 'packages/core/test', '.*rc.cjs', '/scripts', '/sdk'],
    root: true,
};
