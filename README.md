# Hướng Dẫn Sử Dụng Trang Web KFC - Tích Hợp File Markdown & Folder Images

Dự án Website thương hiệu **KFC Việt Nam** được xây dựng với công nghệ thuần **HTML5, CSS3, JavaScript** và sử dụng nguồn dữ liệu trực tiếp từ các file **Markdown (`.md`)** cùng thư mục hình ảnh **`images/`**.

---

## 1. Cấu Trúc Thư Mục Dự Án

```text
Gà Rán Day 2/
├── index.html                   # Giao diện chính của trang web KFC
├── d_li_u_menu_m_n_n_kfc.md     # File dữ liệu thực đơn gốc (bảng CSV Markdown)
├── gioi_thieu.md                # Bài viết giới thiệu KFC & Đại tá Sanders
├── khuyen_mai.md                # Thông tin ưu đãi & mã giảm giá
├── chinh_sach.md                # Chính sách giao hàng 30 phút nóng giòn
├── README.md                    # Tài liệu hướng dẫn dự án
├── css/
│   └── style.css                # Tùy biến phong cách thương hiệu đỏ - trắng KFC
├── js/
│   └── app.js                   # Logic đọc file .md, render menu, giỏ hàng, bộ lọc
└── images/                      # Thư mục hình ảnh
    ├── KFC_logo-image.png       # Logo chính thức của KFC
    ├── logo.png                 # Logo dự phòng
    ├── colonel.png              # Hình ảnh Đại tá Harland Sanders
    ├── hero-bucket.jpg          # Ảnh banner chính và combo gà
    └── products/
        ├── khoai-tay-chien.jpg  # Ảnh sản phẩm Khoai tây chiên (L)
        └── combo-ga-vui-ve.jpg  # Ảnh sản phẩm Combo Gà Vui Vẻ
```

---

## 2. Các Tính Năng Nổi Bật

### 🍗 Đọc Dữ Liệu Tự Động Từ File Markdown (.MD)
- Tệp tin `d_li_u_menu_m_n_n_kfc.md` được phân tích tự động bằng JavaScript để tạo ra danh sách sản phẩm trên giao diện, bao gồm tên món, phân loại, giá bán, mô tả, huy hiệu ("Bán chạy", "Hot", "Mới").
- Bộ đọc hỗ trợ cả 2 chế độ:
  1. **Động (Dynamic Fetch)**: Tải trực tiếp tệp `.md` khi chạy trên Live Server hoặc môi trường HTTP.
  2. **Dự phòng (Embedded Fallback)**: Giúp trang web hoạt động hoàn hảo ngay cả khi bạn nhấn **double-click mở trực tiếp file `index.html`** trên trình duyệt (giao thức `file:///`) mà không bao giờ bị lỗi CORS chặn file.

### 🖼️ Tích Hợp Thư Mục Hình Ảnh (Folder Images)
- Logo và chân dung Đại tá Sanders được tải trực tiếp từ folder `images/`.
- Món khoai tây chiên được kết nối trực tiếp với `images/products/khoai-tay-chien.jpg`.
- Các sản phẩm gà rán, burger, nước ngọt có hệ thống fallback hình ảnh chất lượng cao và fallback hình minh họa chuẩn.

### 🔎 Bộ Lọc & Tìm Kiếm Thông Minh
- Lọc theo danh mục: **Tất Cả**, **Combo**, **Gà Rán**, **Burger**, **Nước Uống**.
- Tìm kiếm theo từ khóa tức thì (tên món, thành phần, mã sản phẩm).
- Sắp xếp giá: Thấp đến cao, cao đến thấp, theo tên món A-Z.

### 📝 Trình Xem & Chỉnh Sửa File .MD Trực Tiếp Trên Web
- Tại mục **"Khám Phá Tài Liệu & Nội Dung .MD"**, bạn có thể:
  - Chuyển đổi xem qua lại giữa các file: `d_li_u_menu_m_n_n_kfc.md`, `gioi_thieu.md`, `khuyen_mai.md`, `chinh_sach.md`.
  - Xem dạng giao diện HTML hoặc xem mã nguồn Markdown gốc.
  - Chỉnh sửa nội dung thực đơn và bấm **"Cập nhật Menu ngay"** để thấy thực đơn thay đổi tức thì!
  - Chọn mở một file `.md` bất kỳ từ máy tính cá nhân bằng nút **"Nạp file .md"**.

### 🛒 Giỏ Hàng & Đặt Món Trực Tuyến
- Thêm/bớt số lượng món, tính tổng tiền tự động.
- Áp dụng các mã voucher giảm giá:
  - `KFC20K`: Giảm ngay 20.000đ.
  - `KFCFREESHIP`: Miễn phí vận chuyển.
  - `CHICKENLOVE`: Tặng 1 ly Pepsi mát lạnh.
- Modal xác nhận đơn hàng và thông báo đặt món thành công với mã vận đơn.

### ⭐ Đánh Giá Khách Hàng & Bản Đồ Google Maps
- Slider đánh giá với ảnh avatar tròn 80x80 và nhận xét tích cực về chất lượng đồ ăn và vệ sinh cửa hàng.
- Bản đồ tương tác Google Maps định vị chính xác cửa hàng **213A Nguyễn Văn Cừ, Chợ Quán, TP. Hồ Chí Minh** và số hotline **1900 6886**.

---

## 3. Cách Mở & Chạy Trang Web

Bạn có thể mở trang web bằng bất kỳ cách nào sau đây:

1. **Cách 1 (Nhanh nhất)**: Nhấp đúp chuột trực tiếp vào file `index.html` trong thư mục `d:\HA\Gà Rán Day 2`. Trang web sẽ mở trên trình duyệt (Chrome, Edge, Firefox, Cốc Cốc) và hiển thị đầy đủ ngay lập tức.
2. **Cách 2 (Sử dụng VS Code Live Server)**:
   - Mở thư mục `Gà Rán Day 2` trong Visual Studio Code.
   - Nhấp chuột phải vào `index.html` -> Chọn **"Open with Live Server"**.
