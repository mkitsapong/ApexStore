<template>
  <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; text-align:center; padding:var(--space-8);">
    <div>
      <div style="font-size:6rem; margin-bottom:var(--space-6); filter:grayscale(1) opacity(0.5);">😢</div>
      <h1 style="font-size:5rem; font-family:var(--font-en); color:var(--gray-700); margin-bottom:var(--space-4);">404</h1>
      <h2 style="margin-bottom:var(--space-4);">ไม่พบหน้าที่คุณต้องการ</h2>
      <p style="color:var(--gray-500); margin-bottom:var(--space-8);">หน้านี้อาจถูกลบหรือย้ายไปที่อื่น</p>
      <RouterLink to="/" class="btn btn-primary btn-lg">🏠 กลับหน้าหลัก</RouterLink>
    </div>
  </div>
</template>
