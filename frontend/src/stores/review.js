import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useReviewStore = defineStore('review', () => {
  const reviews = ref([])

  // 加载复盘记录
  const loadReviews = () => {
    const stored = localStorage.getItem('reviews')
    if (stored) {
      reviews.value = JSON.parse(stored)
    }
  }

  // 保存复盘记录
  const saveReviews = () => {
    localStorage.setItem('reviews', JSON.stringify(reviews.value))
  }

  // 添加复盘记录
  const addReview = (review) => {
    reviews.value.unshift(review)
    saveReviews()
  }

  // 更新复盘记录
  const updateReview = (id, updatedReview) => {
    const index = reviews.value.findIndex(r => r.id === id)
    if (index !== -1) {
      reviews.value[index] = { ...reviews.value[index], ...updatedReview }
      saveReviews()
    }
  }

  // 删除复盘记录
  const deleteReview = (id) => {
    reviews.value = reviews.value.filter(r => r.id !== id)
    saveReviews()
  }

  // 获取最近的复盘记录
  const getRecentReviews = (limit = 5) => {
    return reviews.value
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
  }

  // 获取按类型筛选的复盘记录
  const getFilteredReviews = (type = 'all') => {
    return reviews.value
      .filter(review => type === 'all' || review.type === type)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  return {
    reviews,
    loadReviews,
    addReview,
    updateReview,
    deleteReview,
    getRecentReviews,
    getFilteredReviews
  }
}) 