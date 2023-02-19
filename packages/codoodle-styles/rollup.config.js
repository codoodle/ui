import fs from "fs"
import path from "path"
import { defineConfig } from "rollup"
import eslint from "@rollup/plugin-eslint"
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"

/**
 * @param {string} [file]
 * @param {boolean} [first]
 * @returns {import('rollup').Plugin}
 */
function buildPlugin(file, first) {
  return {
    name: "build",
    options() {
      if (first && fs.existsSync("dist")) {
        fs.rmSync("dist", {
          recursive: true,
        })
      }
    },
    writeBundle() {
      if (file) {
        fs.copyFileSync(
          path.resolve("src", file, `${file}.css`),
          path.resolve("dist", file, `${file}.css`)
        )
        fs.copyFileSync(
          path.resolve("src", file, `${file}.module.css`),
          path.resolve("dist", file, `${file}.module.css`)
        )
      }
    },
  }
}

/**
 * @type {import('@rollup/plugin-node-resolve').RollupNodeResolveOptions}
 */
const resolveOptions = {
  extensions: [".mjs", ".js", ".json", ".node", ".ts", ".tsx"],
}
/**
 * @type {import('@rollup/plugin-babel').RollupBabelInputPluginOptions}
 */
const babelOptions = {
  babelHelpers: "bundled",
  extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
}

const files = ["scrollBar"]
export default defineConfig([
  {
    input: `src/index.ts`,
    output: {
      format: "es",
      dir: `dist`,
    },
    plugins: [
      eslint(),
      commonjs(),
      resolve(resolveOptions),
      babel(babelOptions),
      buildPlugin(undefined, true),
    ],
  },
  ...files.map(
    /**
     *
     * @param {*} file
     * @returns {import('rollup').RollupOptions}
     */
    (file) => ({
      input: `src/${file}/index.ts`,
      output: {
        format: "es",
        dir: `dist/${file}`,
      },
      plugins: [
        babel({
          babelHelpers: "bundled",
          extensions: [".ts"],
        }),
        buildPlugin(file),
      ],
    })
  ),
])
