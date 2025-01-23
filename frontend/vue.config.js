const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8888
  },
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          javascriptEnabled: true
        }
      }
    }
  },
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => ({
        ...options,
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('vue-'),
          // 启用编译器宏
          hoistStatic: true,
          prefixIdentifiers: true
        }
      }))
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@vue/cli-plugin-babel/preset'],
              plugins: [
                '@babel/plugin-transform-private-methods',
                '@babel/plugin-proposal-private-methods',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-private-property-in-object'
              ]
            }
          }
        }
      ]
    }
  }
})

