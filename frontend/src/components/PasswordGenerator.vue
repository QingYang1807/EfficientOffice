<template>
    <div class="container">
        <div class="row justify-content-center mt-5">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h1 class="card-title text-center mb-4">密码生成器</h1>
                        <div class="mb-3">
                            <label for="length" class="form-label">密码长度:</label>
                            <input type="number" id="length" v-model="passwordLength" class="form-control" min="6" max="128" />
                        </div>
                        <div class="mb-3">
                            <div class="form-check" v-for="(option, index) in characterOptions" :key="index">
                                <input class="form-check-input" type="checkbox" :id="option.name" v-model="option.checked">
                                <label class="form-check-label" :for="option.name">{{ option.label }}</label>
                            </div>
                        </div>
                        <div class="d-grid gap-2 mb-3">
                            <button @click="generatePassword" class="btn btn-primary">生成密码</button>
                        </div>
                        <div class="input-group">
                            <input type="text" v-model="password" class="form-control" readonly>
                            <button @click="copyPassword" class="btn btn-outline-secondary">复制</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
  
<script>
export default {
    data() {
        return {
            passwordLength: 12,
            password: '',
            characterOptions: [
                { name: 'uppercase', label: '包含大写字母', checked: true },
                { name: 'lowercase', label: '包含小写字母', checked: true },
                { name: 'numbers', label: '包含数字', checked: true },
                { name: 'symbols', label: '包含特殊符号', checked: true }
            ]
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
            this.characterOptions.forEach(option => {
                if (option.checked) {
                    availableCharacters += characterSets[option.name]
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
.container {
    height: 100%;
}

.card {
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    border: none;
}
</style>