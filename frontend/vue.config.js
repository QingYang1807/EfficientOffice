const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8888,
    proxy: {
      '/api/kimi': {
        target: 'https://api.moonshot.cn/v1',
        changeOrigin: true,
        pathRewrite: {
          '^/api/kimi': ''
        },
        onProxyReq: function(proxyReq) {
          // 添加CORS头
          proxyReq.setHeader('Origin', 'https://api.moonshot.cn');
        }
      },
      '/api/qwen': {
        target: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        changeOrigin: true,
        pathRewrite: {
          '^/api/qwen': ''
        }
      },
      '/api/deepseek': {
        target: 'https://api.siliconflow.cn/v1',
        changeOrigin: true,
        pathRewrite: {
          '^/api/deepseek': ''
        }
      }
    },
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
    config.plugin('define').tap(args => {
      Object.assign(args[0], {
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
        __VUE_OPTIONS_API__: JSON.stringify(true),
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false)
      })
      return args
    })
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
    },
    resolve: {
      fallback: {
        "path": require.resolve("path-browserify"),
        "stream": require.resolve("stream-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "buffer": require.resolve("buffer/")
      }
    }
  }
})

