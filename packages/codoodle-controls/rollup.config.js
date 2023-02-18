import fs from "fs"
import { defineConfig } from "rollup"
import commonjs from "@rollup/plugin-commonjs"
import resolve from "@rollup/plugin-node-resolve"
import babel from "@rollup/plugin-babel"
import css from "rollup-plugin-import-css"
import html from "@rollup/plugin-html"

/**
 * @param {boolean} [first]
 * @returns {import('rollup').Plugin}
 */
function buildPlugin(first) {
  return {
    name: "build",
    options() {
      if (first && fs.existsSync("dist")) {
        fs.rmSync("dist", {
          recursive: true,
        })
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

export default defineConfig([
  process.env["ROLLUP_WATCH"]
    ? {
        input: "src/preview.ts",
        output: {
          format: "es",
          dir: "dist",
        },
        plugins: [
          commonjs(),
          resolve(resolveOptions),
          babel(babelOptions),
          css({
            output: "index.css",
          }),
          html({
            fileName: "preview.html",
          }),
        ],
      }
    : {
        input: "src/index.ts",
        output: {
          format: "es",
          dir: "dist",
        },
        external: [/core-js\/.+/],
        plugins: [
          commonjs(),
          resolve(resolveOptions),
          babel(babelOptions),
          css({
            output: "index.css",
          }),
          buildPlugin(true),
        ],
      },
])
