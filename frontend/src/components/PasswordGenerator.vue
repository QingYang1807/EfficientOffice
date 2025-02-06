<template>
  <div class="password-generator">
    <a-card title="密码生成器" :bordered="false">
      <a-form layout="vertical">
        <a-form-item label="密码长度">
          <a-input-number
            v-model:value="passwordLength"
            :min="6"
            :max="128"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item>
          <a-checkbox-group v-model:value="selectedOptions">
            <a-checkbox value="uppercase">包含大写字母</a-checkbox>
            <a-checkbox value="lowercase">包含小写字母</a-checkbox>
            <a-checkbox value="numbers">包含数字</a-checkbox>
            <a-checkbox value="symbols">包含特殊符号</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" block @click="generatePassword">
            生成密码
          </a-button>
        </a-form-item>

        <a-form-item>
          <a-input-group compact>
            <a-input
              v-model:value="password"
              readonly
              style="width: calc(100% - 80px)"
            />
            <a-button @click="copyPassword" style="width: 80px">
              复制
            </a-button>
          </a-input-group>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script>
export default {
    data() {
        return {
            passwordLength: 12,
            password: '',
            selectedOptions: ['uppercase', 'lowercase', 'numbers', 'symbols']
        }
    },
    methods: {
        generatePassword() {
            const characterSets = {
                uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                lowercase: 'abcdefghijklmnopqrstuvwxyz',
                numbers: '0123456789',
                symbols: '!@#$%^&*()_-+={}[]|;:,.<>?'
            }

            let availableCharacters = ''
            this.selectedOptions.forEach(option => {
                if (option === 'uppercase') {
                    availableCharacters += characterSets.uppercase
                } else if (option === 'lowercase') {
                    availableCharacters += characterSets.lowercase
                } else if (option === 'numbers') {
                    availableCharacters += characterSets.numbers
                } else if (option === 'symbols') {
                    availableCharacters += characterSets.symbols
                }
            })

            if (availableCharacters === '') {
                alert('请至少选择一种字符类型');
                return;
            }
            let newPassword = '';
            for (let i = 0; i < this.passwordLength; i++) {
                const randomIndex = Math.floor(Math.random() * availableCharacters.length);
                newPassword += availableCharacters[randomIndex];
            }

            this.password = newPassword;
        },
        copyPassword() {
            if (!this.password) {
                return;
            }

            navigator.clipboard.writeText(this.password)
                .then(() => {
                    alert('密码已复制到剪贴板');
                })
                .catch(() => {
                    alert('复制失败，请手动复制');
                });
        }
    }
}
</script>

<style scoped>
.password-generator {
  max-width: 600px;
  margin: 20px auto;
  padding: 0 20px;
}

:deep(.ant-card-head-title) {
  text-align: center;
  font-size: 20px;
}

:deep(.ant-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>