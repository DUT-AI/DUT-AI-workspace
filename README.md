# DUT-AI Unified App Portal (`app.dutai.io.vn`)

Ứng dụng **Portal Shell** hợp nhất 3 trang web độc lập thành 1 hệ thống quản trị duy nhất:
* 📊 **Hệ thống Quản lý**: `https://manage.dutai.io.vn/dashboard` $\rightarrow$ `/manage/dashboard`
* 📝 **Hệ thống LMS**: `https://lms.dutai.io.vn/dashboard` $\rightarrow$ `/lms/dashboard`
* 📅 **Công việc Meetly**: `https://meetly.dutai.io.vn/tasks` $\rightarrow$ `/meetly/tasks` (hoặc `/tasks`)

---

## 🚀 Điểm nổi bật & Kỹ thuật cốt lõi

1. **Persistent DOM Iframe Caching (Keep-Alive)**:
   * Chuyển tab giữa các ứng dụng diễn ra **tức thì (< 100ms)** mà không bị reload lại trang.
   * Giữ nguyên dữ liệu form đang nhập dở và vị trí cuộn trang.
2. **Triệt tiêu hoàn toàn Double Scrollbar**:
   * Viewport cố định `100vh flex layout`, đảm bảo chỉ có duy nhất thanh cuộn nội dung của ứng dụng con.
3. **Đồng bộ URL mượt mà (HTML5 History API)**:
   * Đường dẫn trên thanh địa chỉ đổi theo module: `/manage/dashboard`, `/quiz/dashboard`, `/meetly/tasks`.
   * Hỗ trợ lưu bookmark và nút Back/Forward của trình duyệt.
4. **Header & Sidebar đồng nhất**:
   * Giao diện hiện đại (Next.js 14 App Router + Tailwind CSS + Lucide Icons).
   * Hỗ trợ Quick Switcher chuyển nhanh ứng dụng, responsive drawer trên điện thoại và máy tính bảng.
5. **Cơ chế chịu lỗi (Watchdog Error Boundary)**:
   * Skeleton loader khi tải trang; nếu máy chủ con phản hồi chậm hoặc lỗi mạng, hiển thị giao diện fallback lịch sự với nút *"Thử tải lại"* và *"Mở trong tab mới"*.

---

## 🛠️ Hướng dẫn cài đặt & Chạy ứng dụng

### 1. Yêu cầu môi trường
* Node.js v18.0.0+ (Khuyên dùng v20+)
* npm hoặc pnpm / yarn

### 2. Khởi chạy môi trường phát triển (Development)
```bash
# Cài đặt thư viện (nếu chưa cài)
npm install

# Chạy server phát triển
npm run dev
```
Truy cập: `http://localhost:3000` (hệ thống sẽ tự động chuyển hướng vào `/manage/dashboard`).

### 3. Đóng gói cho môi trường Production (Production Build)
```bash
npm run build
npm run start
```

### 4. Chạy kiểm thử Unit Tests
```bash
npx tsx tests/unit/modules.test.ts
```

---

## ⚙️ Cấu hình máy chủ 3 web con (Security Configuration)

Để 3 ứng dụng con hiển thị mượt mà bên trong `https://app.dutai.io.vn/` mà không bị trình duyệt chặn iframe:

1. **Thêm HTTP Header trên Nginx / Cloudflare / Server của 3 web con**:
   ```http
   Content-Security-Policy: frame-ancestors 'self' https://app.dutai.io.vn http://localhost:3000;
   ```
2. **Loại bỏ header cũ**:
   Xóa hoặc không đặt `X-Frame-Options: DENY` hoặc `SAMEORIGIN` (dùng `frame-ancestors` ở trên là chuẩn W3C hiện đại nhất).
3. **Cấu hình Cookie phiên làm việc (Session Cookies)**:
   * Với các subdomain chung `.dutai.io.vn`: Đặt cookie domain là `.dutai.io.vn`.
   * Với domain khác (`quiz.dutai.site`): Đặt cookie `SameSite=None; Secure`.

---

## 📂 Cấu trúc mã nguồn

```text
src/
├── app/
│   ├── layout.tsx             # Root Layout (Metadata, fonts, theme)
│   ├── page.tsx               # Redirect từ '/' sang '/manage/dashboard'
│   ├── (portal)/
│   │   ├── layout.tsx         # Portal Shell Layout (Header + Sidebar cố định)
│   │   ├── [moduleId]/
│   │   │   └── [...slug]/
│   │   │       └── page.tsx   # Dynamic Portal route
│   │   └── tasks/
│   │       └── page.tsx       # Alias route riêng cho Meetly tasks
│   └── api/
│       └── health/
│           └── route.ts       # Endpoint kiểm tra sức khỏe hệ thống
├── config/
│   └── modules.ts             # Danh mục cấu hình 3 ứng dụng
├── hooks/
│   ├── usePortalRouter.ts     # Hook đồng bộ route với trình duyệt
│   └── useFrameManager.ts     # Quản lý Keep-Alive, Loading State & Watchdog
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx       # Khung hình 100vh flex layout
│   │   ├── Header.tsx         # Thanh Topbar (Logo DUT-AI, Quick Switcher, Avatar)
│   │   ├── Sidebar.tsx        # Thanh Sidebar điều hướng (Responsive drawer)
│   │   └── QuickSwitcher.tsx  # Menu dropdown chuyển nhanh ứng dụng
│   ├── portal/
│   │   ├── ViewportContainer.tsx # Container giữ persistent iframes không bị reload
│   │   ├── ModuleIframe.tsx      # Thẻ iframe độc lập với watchdog 10s
│   │   ├── SkeletonLoader.tsx    # Hiệu ứng shimmer khi đang tải
│   │   └── ErrorBoundaryCard.tsx # Giao diện fallback khi máy chủ con bị lỗi
│   └── common/
│       └── Icon.tsx           # Lucide icon động
├── middleware.ts              # Middleware xử lý route & security headers
├── next.config.mjs            # Cấu hình Next.js
└── tailwind.config.ts         # Giao diện Tailwind CSS
```
