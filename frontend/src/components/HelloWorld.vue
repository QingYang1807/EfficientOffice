<template>
  <div class="background">
    <div class="content">
      <h1>Welcome to Efficient Office</h1>
      <p>A platform to boost your office productivity</p>
      <button>Get Started</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.background {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 50px;
  border-radius: 10px;
}

h1 {
  font-weight: bold;
}

button {
  background-color: #42b983;
  color: white;
  font-weight: bold;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
}

button:hover {
  background-color: #2c3e50;
}
</style>
