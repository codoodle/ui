import fs from "fs"
import path from "path"
import { defineConfig } from "rollup"
import scss from "rollup-plugin-scss"
import sass from "sass"
import postcss from "postcss"
import modules from "postcss-modules"

/**
 * @param {string} file
 * @returns {import('rollup').Plugin}
 */
function buildPlugin(file) {
  return {
    name: "build",
    writeBundle(options) {
      if (options.file) {
        fs.cpSync(path.resolve(file, "src"), path.resolve("src", file), {
          force: true,
          recursive: true,
        })
        fs.rmSync(path.resolve(file), {
          recursive: true,
        })
      }
    },
  }
}

const files = ["scrollBar", "grid"]
fs.writeFileSync(
  path.resolve("src", "index.ts"),
  `${files.map((file) => `import ${file} from "./${file}"`).join("\n")}

export { ${files.join(", ")} }
`
)
for (const file of files) {
  if (!fs.existsSync(file)) {
    fs.mkdirSync(file)
  }
  fs.writeFileSync(
    path.resolve(file, `${file}.js`),
    `import "../src/${file}/${file}.scss"`
  )
}
export default defineConfig(
  files.reduce(
    /**
     *
     * @param {import('rollup').RollupOptions[]} acc
     * @param {string} file
     * @returns
     */
    (acc, file) => {
      acc.push(
        {
          input: `${file}/${file}.js`,
          output: {
            file: `${file}/${file}.module.js`,
          },
          plugins: [
            scss({
              fileName: `src/${file}.module.css`,
              sass,
            }),
          ],
        },
        {
          input: `${file}/${file}.js`,
          output: {
            file: `${file}/${file}.out.js`,
          },
          plugins: [
            scss({
              fileName: `src/${file}.css`,
              sass,
              // @ts-ignore
              processor: () => {
                return postcss([
                  modules({
                    generateScopedName: `__[hash:base64]`,
                    getJSON(_, json) {
                      fs.writeFileSync(
                        path.resolve(file, "src", `${file}.module.css.ts`),
                        `type ${file.replace(/^\w/, (m) =>
                          m.toUpperCase()
                        )}ClassNames = {
  ${Object.keys(json)
    .map((key) => {
      return `${key}: string`
    })
    .join("\n  ")}
}

declare const ${file}ClassNames: ${file.replace(/^\w/, (m) =>
                          m.toUpperCase()
                        )}ClassNames

export default ${file}ClassNames
export type { ${file.replace(/^\w/, (m) => m.toUpperCase())}ClassNames }
`
                      )
                      fs.writeFileSync(
                        path.resolve(file, "src", `index.ts`),
                        `type ${file.replace(/^\w/, (m) =>
                          m.toUpperCase()
                        )}ClassNames = {
  ${Object.keys(json)
    .map((key) => {
      return `${key}: string`
    })
    .join("\n  ")}
}

const ${file}ClassNames: ${file.replace(/^\w/, (m) =>
                          m.toUpperCase()
                        )}ClassNames = {
  ${Object.keys(json)
    .map((key) => {
      return `${key}: "${json[key]}",`
    })
    .join("\n  ")}
}

export default ${file}ClassNames
export type { ${file.replace(/^\w/, (m) => m.toUpperCase())}ClassNames }
`
                      )
                    },
                  }),
                ])
              },
            }),
            buildPlugin(file),
          ],
        }
      )
      return acc
    },
    []
  )
)
