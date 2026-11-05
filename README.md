# Card Room Online — Baccarat, Ba Cây, Sâm Lốc

Node.js + Express + Socket.IO. Phòng 2–4 người, link/mã phòng, sẵn sàng, điểm VND ảo. Không có thanh toán hay rút tiền thật.

## Chạy local

```bash
npm install
npm start
```

Mở http://localhost:3000

## Render

Tạo **Web Service** từ repository GitHub. Build command: `npm install`; Start command: `npm start`. Không chọn Static Site. Server sử dụng `process.env.PORT`.

## Quy tắc

- Baccarat: 3 lựa chọn, chia theo quy tắc rút lá thứ ba, mỗi người đoán đúng +500 điểm ảo.
- Ba Cây: 36 lá A–9, chia 3 lá/người, lấy tổng modulo 10; cao nhất thắng +500. Nếu bằng điểm cao nhất, cùng thắng +500 (không xét chất).
- Sâm: 52 lá, 10 lá/người, bài 3 đến 2, không phân chất; đánh rác/đôi/sám/tứ quý/sảnh từ 3 lá, tứ quý chặt 2. Không được về bằng 2. Người thắng nhận 1.000 điểm ảo cho mỗi lá còn lại của từng đối thủ.
- Báo Sâm: người đến lượt đầu ván có thể báo Sâm. Nếu người khác chặn bất kỳ bộ bài nào sau đó, người chặn được +20.000 và người báo bị -20.000, người chặn thắng và đi trước ván sau. Nếu báo Sâm thành công, mỗi người thua trả 20.000. Phiên bản này chưa có đủ luật địa phương khác như ăn trắng, đền làng, phạt thối 2, và xác nhận báo Sâm theo thứ tự nhiều người.

## Giới hạn

Dữ liệu phòng, kết quả và điểm số lưu trong RAM: mất khi Render restart. Mất kết nối thì người chơi rời phòng; ván Sâm đang diễn ra bị hủy. Chỉ chạy 1 instance, chưa có đăng nhập, reconnect, database hoặc chống gian lận nâng cao. Bản demo không phù hợp vận hành cược tiền thật.
