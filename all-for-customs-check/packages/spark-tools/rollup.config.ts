import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/hooks/index.ts',
  output: [
    {
      file: 'dist/hooks/index.js',
      format: 'es',
      sourcemap: true,
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.build.json',
      declaration: true,
      declarationDir: 'dist/hooks',
      outDir: 'dist/hooks',
    })
  ],
  external: ['react', 'react-dom']
};
