export default {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage",
        corejs: {
          version: "3.28",
          proposals: false,
        },
      },
    ],
    "@babel/preset-typescript",
  ],
  plugins: [["@babel/plugin-proposal-decorators", { legacy: true }]],
}
