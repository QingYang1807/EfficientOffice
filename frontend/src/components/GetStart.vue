<template>
    <div class="card-menu">
        <div class="container">
            <div class="row">
                <div class="col-md-4" v-for="route in routes" :key="route.name">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="card-title">{{ route.name }}</h5>
                        </div>
                        <div class="card-body">
                            <p class="card-text">{{ route.description }}</p>
                            <router-link :to="route.path" class="btn btn-primary">Go to {{ route.name }}</router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
  
<script>
import { routes } from "../router/index";

export default {
    data() {
        // 过滤掉导航页（GetStart）本身，以免出现在卡片列表中
        const filteredRoutes = routes.filter(route => route.name !== "GetStart");

        return {
            routes: filteredRoutes
        };
    }
};
</script>
  
<style scoped>
.card-menu {
    padding: 2rem 0;
}

.card {
    background-image: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    margin-bottom: 2rem;
    border: none;
}

.card:hover {
    box-shadow: 0 14px 26px rgba(0, 0, 0, 0.2);
}

.card-header {
    background-color: transparent;
    color: #fff;
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
  