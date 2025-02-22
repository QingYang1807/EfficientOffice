module.exports = {
  presets: [
    ['@vue/cli-plugin-babel/preset', {
      targets: {
        node: 'current'
      }
    }]
  ],
  plugins: [
    '@vue/babel-plugin-jsx',
    '@babel/plugin-transform-private-methods',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-property-in-object'
  ]
}
