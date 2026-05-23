// Book Cover Storage Test Utilities
// Use these in browser console to test the fixes

// 1. Check current storage usage
function checkStorageUsage() {
  const store = window.__PINIA_STORE__?.bookCovers || {}
  const size = store.getStorageSize?.()
  console.log('📊 Storage Usage:', size)
  console.log(`- Covers stored: ${size.count}`)
  console.log(`- Size: ${size.kb} KB (${size.mb} MB)`)

  // Check localStorage quota
  const total = JSON.stringify(localStorage).length
  const quotaKB = (total / 1024).toFixed(2)
  console.log(`- Total localStorage: ${quotaKB} KB`)

  if (total > 4 * 1024 * 1024) {
    console.warn('⚠️ Approaching 5MB localStorage limit!')
  }
}

// 2. Simulate adding many covers to test cleanup
async function testCleanup() {
  console.log('🧹 Testing automatic cleanup...')
  const store = window.__PINIA_STORE__?.bookCovers

  // Add 60 fake covers (should trigger cleanup at 50)
  for (let i = 1; i <= 60; i++) {
    const fakeData = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUg`
    store.setCover(`test_${i}`, fakeData)
  }

  const size = store.getStorageSize()
  console.log(`✅ After adding 60 covers, have ${size.count} (should be ~50)`)
}

// 3. Test image compression
async function testCompression(file) {
  console.log('🔄 Testing image compression...')

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 800
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const compressed = canvas.toDataURL('image/jpeg', 0.8)

        console.log('📸 Compression Results:')
        console.log(`- Original: ${(file.size / 1024).toFixed(2)} KB`)
        console.log(`- Compressed: ${((compressed.length * 3) / 4 / 1024).toFixed(2)} KB`)
        console.log(`- Reduction: ${((1 - compressed.length / file.size) * 100).toFixed(1)}%`)

        resolve(compressed)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 4. Clear test data
function clearTestCovers() {
  console.log('🗑️ Clearing test covers...')
  const store = window.__PINIA_STORE__?.bookCovers
  const keys = Object.keys(store.covers)

  keys.forEach((key) => {
    if (key.startsWith('test_')) {
      store.removeCover(key)
    }
  })

  console.log(`✅ Removed ${keys.length} test covers`)
}

// 5. Monitor localStorage quota
function monitorQuota() {
  setInterval(() => {
    const used = JSON.stringify(localStorage).length
    const percent = ((used / (5 * 1024 * 1024)) * 100).toFixed(1)
    console.log(`💾 localStorage: ${(used / 1024).toFixed(0)} KB (${percent}% of 5MB)`)
  }, 5000)
}

console.log('✅ Test utilities loaded!')
console.log('Available functions:')
console.log('- checkStorageUsage()')
console.log('- testCleanup()')
console.log('- testCompression(file)')
console.log('- clearTestCovers()')
console.log('- monitorQuota()')
