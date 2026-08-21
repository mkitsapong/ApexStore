<template>
  <footer style="border-top:1px solid var(--glass-border); padding: var(--space-12) 0; margin-top: auto;">
    <div class="container">
      <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: var(--space-8); margin-bottom: var(--space-8);">
        <!-- Brand -->
        <div>
          <div style="font-size:1.25rem; font-weight:800; color:var(--white); margin-bottom:var(--space-3); font-family:var(--font-en);">
            ⚡ Apex<span style="color:var(--accent-400)">Store</span>
          </div>
          <p style="font-size:0.875rem; color:var(--gray-500); line-height:1.7; max-width:280px;">
            ร้านขายบัญชี Streaming & Digital Subscriptions คุณภาพสูง ราคาถูก พร้อมบริการหลังการขาย 24 ชั่วโมง
          </p>
          <div style="display:flex; gap:var(--space-3); margin-top:var(--space-4);">
            <a href="#" class="social-btn">💬</a>
            <a href="#" class="social-btn">📘</a>
            <a href="#" class="social-btn">📸</a>
          </div>
        </div>

        <!-- Links -->
        <div>
          <h6 style="color:var(--white); margin-bottom:var(--space-4); font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em;">ร้านค้า</h6>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:var(--space-2);">
            <li><RouterLink to="/shop" class="footer-link">สินค้าทั้งหมด</RouterLink></li>
            <li><RouterLink to="/shop?cat=streaming" class="footer-link">Streaming</RouterLink></li>
            <li><RouterLink to="/shop?cat=music" class="footer-link">Music</RouterLink></li>
            <li><RouterLink to="/shop?cat=ai" class="footer-link">AI Tools</RouterLink></li>
          </ul>
        </div>

        <div>
          <h6 style="color:var(--white); margin-bottom:var(--space-4); font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em;">บัญชีของฉัน</h6>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:var(--space-2);">
            <li><RouterLink to="/dashboard" class="footer-link">Dashboard</RouterLink></li>
            <li><RouterLink to="/wallet" class="footer-link">Wallet</RouterLink></li>
            <li><RouterLink to="/orders" class="footer-link">คำสั่งซื้อ</RouterLink></li>
            <li><RouterLink to="/topup" class="footer-link">เติมเงิน</RouterLink></li>
          </ul>
        </div>

        <div>
          <h6 style="color:var(--white); margin-bottom:var(--space-4); font-size:0.9rem; text-transform:uppercase; letter-spacing:0.05em;">ติดต่อ</h6>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:var(--space-2);">
            <li style="font-size:0.875rem; color:var(--gray-500);">💬 Line: @apexstore</li>
            <li style="font-size:0.875rem; color:var(--gray-500);">📧 support@apexstore.com</li>
            <li style="font-size:0.875rem; color:var(--gray-500);">⏰ ตอบ 24 ชั่วโมง</li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div style="border-top:1px solid var(--glass-border); padding-top:var(--space-6); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:var(--space-4);">
        <p style="font-size:0.8125rem; color:var(--gray-600);">
          © 2024 ApexStore. สงวนลิขสิทธิ์ทุกประการ.
        </p>
        <div style="display:flex; gap:var(--space-4);">
          <a href="#" class="footer-link" style="font-size:0.8125rem;">นโยบายความเป็นส่วนตัว</a>
          <a href="#" class="footer-link" style="font-size:0.8125rem;">เงื่อนไขการใช้บริการ</a>
          <a href="#" class="footer-link" style="font-size:0.8125rem;">การคืนเงิน</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-link {
  font-size: 0.875rem;
  color: var(--gray-500);
  transition: color var(--transition-fast);
}
.footer-link:hover { color: var(--accent-300); }

.social-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all var(--transition-fast);
  cursor: pointer;
}
.social-btn:hover {
  background: var(--glass-hover);
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  div[style*="grid-template-columns: 2fr"] {
    grid-template-columns: 1fr 1fr !important;
  }
}
</style>
