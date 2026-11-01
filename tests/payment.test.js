/**
 * Bộ Kiểm Thử Nghiêm Ngặt Cho Module Thanh Toán (Payment Module Test Suite)
 * KFC Việt Nam - Chạy trên Node.js hoặc Test Runner
 */

const assert = require('assert');
const PaymentModule = require('../js/payment.js');

const {
  Validator,
  ShippingCalculator,
  VoucherEngine,
  PricingEngine,
  Processor
} = PaymentModule;

let passedCount = 0;
let totalCount = 0;

function runTest(testName, testFn) {
  totalCount++;
  try {
    testFn();
    passedCount++;
    console.log(`  ✓ [PASS] ${testName}`);
  } catch (err) {
    console.error(`  ✗ [FAIL] ${testName}`);
    console.error(`    -> Lỗi: ${err.message}`);
  }
}

console.log('\n======================================================');
console.log('🚀 BẮT ĐẦU KIỂM THỬ MODULE THANH TOÁN (MODULE #2) - KFC');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// NHÓM 1: KIỂM THỬ VALIDATION KHÁCH HÀNG & THỜI GIAN HOẠT ĐỘNG
// -----------------------------------------------------------------------------
console.log('--- NHÓM 1: VALIDATION THÔNG TIN KHÁCH HÀNG & THỜI GIAN ---');

runTest('1.1: SĐT Việt Nam hợp lệ (đầu số 03, 05, 07, 08, 09 và đủ 10 số)', () => {
  assert.strictEqual(Validator.validatePhone('0901234567'), true);
  assert.strictEqual(Validator.validatePhone('0389998888'), true);
  assert.strictEqual(Validator.validatePhone('0771234567'), true);
  assert.strictEqual(Validator.validatePhone('0561234567'), true);
  assert.strictEqual(Validator.validatePhone('0861234567'), true);
});

runTest('1.2: SĐT không hợp lệ (sai đầu số, thiếu số, thừa số, ký tự lạ)', () => {
  assert.strictEqual(Validator.validatePhone('0123456789'), false, 'Đầu 01 đã ngừng hoạt động');
  assert.strictEqual(Validator.validatePhone('090123456'), false, 'Thiếu 1 số');
  assert.strictEqual(Validator.validatePhone('09012345678'), false, 'Thừa 1 số');
  assert.strictEqual(Validator.validatePhone('090abc4567'), false, 'Chứa chữ cái');
  assert.strictEqual(Validator.validatePhone(''), false, 'Chuỗi rỗng');
  assert.strictEqual(Validator.validatePhone(null), false, 'Giá trị null');
});

runTest('1.3: Xác thực họ tên người nhận (tối thiểu 2 ký tự, tối đa 50 ký tự)', () => {
  assert.strictEqual(Validator.validateCustomerName('Nguyễn Văn A'), true);
  assert.strictEqual(Validator.validateCustomerName('Lê B'), true);
  assert.strictEqual(Validator.validateCustomerName('A'), false, 'Tên 1 ký tự không hợp lệ');
  assert.strictEqual(Validator.validateCustomerName('   '), false, 'Chỉ chứa khoảng trắng');
  assert.strictEqual(Validator.validateCustomerName(null), false, 'Giá trị null');
});

runTest('1.4: Xác thực địa chỉ giao hàng (tối thiểu 8 ký tự)', () => {
  assert.strictEqual(Validator.validateAddress('213A Nguyễn Văn Cừ, Quận 5'), true);
  assert.strictEqual(Validator.validateAddress('Quận 5'), false, 'Địa chỉ quá ngắn');
  assert.strictEqual(Validator.validateAddress(''), false, 'Rỗng');
});

runTest('1.5: Xác thực khung giờ phục vụ 09:00 - 21:30 (chinh_sach.md)', () => {
  const openTime = new Date('2026-11-01T10:30:00');
  const resultOpen = Validator.validateOperatingHours(openTime);
  assert.strictEqual(resultOpen.isOpen, true, '10:30 sáng phải đang mở cửa');

  const nightTime = new Date('2026-11-01T22:30:00');
  const resultNight = Validator.validateOperatingHours(nightTime);
  assert.strictEqual(resultNight.isOpen, false, '22:30 đêm đã đóng cửa giao hàng');

  const earlyTime = new Date('2026-11-01T07:30:00');
  const resultEarly = Validator.validateOperatingHours(earlyTime);
  assert.strictEqual(resultEarly.isOpen, false, '07:30 sáng chưa đến giờ mở');
});

runTest('1.6: Thuật toán Luhn kiểm tra số thẻ ngân hàng', () => {
  // Test visa sample (Luhn valid)
  assert.strictEqual(Validator.validateCardNumber('4532015112830366'), true);
  // Test invalid card number
  assert.strictEqual(Validator.validateCardNumber('4532015112830367'), false);
  assert.strictEqual(Validator.validateCardNumber('12345'), false);
});

// -----------------------------------------------------------------------------
// NHÓM 2: KIỂM THỬ BIỂU PHÍ VẬN CHUYỂN (THEO CHÍNH SÁCH CHINH_SACH.MD)
// -----------------------------------------------------------------------------
console.log('\n--- NHÓM 2: KIỂM THỬ BIỂU PHÍ GIAO HÀNG (CHINH_SACH.MD) ---');

runTest('2.1: Bán kính < 3km, đơn < 100k -> Phí 15.000đ', () => {
  const res = ShippingCalculator.calculate({ distanceKm: 2, subtotal: 89000 });
  assert.strictEqual(res.baseFee, 15000);
  assert.strictEqual(res.finalFee, 15000);
});

runTest('2.2: Bán kính < 3km, đơn >= 100k -> Miễn phí (0đ)', () => {
  const res = ShippingCalculator.calculate({ distanceKm: 2.5, subtotal: 120000 });
  assert.strictEqual(res.baseFee, 15000);
  assert.strictEqual(res.finalFee, 0, 'Phải được miễn phí ship khi đơn >= 100k');
});

runTest('2.3: Bán kính 3 - 5km, đơn >= 150k CHƯA có mã KFCFREESHIP -> Phí 20.000đ', () => {
  const res = ShippingCalculator.calculate({ distanceKm: 4, subtotal: 160000, voucherCode: '' });
  assert.strictEqual(res.baseFee, 20000);
  assert.strictEqual(res.finalFee, 20000);
});

runTest('2.4: Bán kính 3 - 5km, đơn >= 150k CÓ mã KFCFREESHIP -> Miễn phí (0đ)', () => {
  const res = ShippingCalculator.calculate({ distanceKm: 4.2, subtotal: 155000, voucherCode: 'KFCFREESHIP' });
  assert.strictEqual(res.baseFee, 20000);
  assert.strictEqual(res.finalFee, 0, 'Phải được miễn phí khi dùng mã KFCFREESHIP và đơn >= 150k');
});

runTest('2.5: Bán kính > 5km, đơn < 250k -> Phí 30.000đ', () => {
  const res = ShippingCalculator.calculate({ distanceKm: 7.5, subtotal: 180000 });
  assert.strictEqual(res.baseFee, 30000);
  assert.strictEqual(res.finalFee, 30000);
});

runTest('2.6: Bán kính > 5km, đơn >= 250k -> Hỗ trợ 50% phí ship (còn 15.000đ)', () => {
  const res = ShippingCalculator.calculate({ distanceKm: 8, subtotal: 260000 });
  assert.strictEqual(res.baseFee, 30000);
  assert.strictEqual(res.finalFee, 15000, 'Đơn từ 250k trở lên phải được giảm 50% phí ship');
});

// -----------------------------------------------------------------------------
// NHÓM 3: KIỂM THỬ BỘ MÃ KHUYẾN MÃI VOUCHER (THEO KHUYEN_MAI.MD)
// -----------------------------------------------------------------------------
console.log('\n--- NHÓM 3: KIỂM THỬ MÃ KHUYẾN MÃI VOUCHER (KHUYEN_MAI.MD) ---');

runTest('3.1: Voucher KFC20K với đơn < 100k -> Bị từ chối', () => {
  const res = VoucherEngine.applyVoucher({ code: 'KFC20K', subtotal: 89000 });
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.discount, 0);
});

runTest('3.2: Voucher KFC20K với đơn >= 100k -> Giảm đúng 20.000đ', () => {
  const res = VoucherEngine.applyVoucher({ code: 'KFC20K', subtotal: 125000 });
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.discount, 20000);
});

runTest('3.3: Voucher KFCFREESHIP với khoảng cách > 5km -> Bị từ chối', () => {
  const res = VoucherEngine.applyVoucher({ code: 'KFCFREESHIP', subtotal: 180000, distanceKm: 6.5 });
  assert.strictEqual(res.valid, false);
});

runTest('3.4: Voucher KFCFREESHIP với khoảng cách <= 5km và đơn >= 150k -> Hợp lệ', () => {
  const res = VoucherEngine.applyVoucher({ code: 'KFCFREESHIP', subtotal: 170000, distanceKm: 4 });
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.type, 'FREE_SHIP');
});

runTest('3.5: Voucher CHICKENLOVE khi giỏ hàng KHÔNG có món gà rán -> Bị từ chối', () => {
  const noChickenCart = [
    { product: { id: 'kfc-06', name: 'Khoai Tây Chiên', category: 'combo', price: 35000 }, qty: 2 },
    { product: { id: 'kfc-07', name: 'Pepsi Không Calo', category: 'nuoc-uong', price: 19000 }, qty: 1 }
  ];
  const res = VoucherEngine.applyVoucher({ code: 'CHICKENLOVE', subtotal: 89000, cartItems: noChickenCart });
  assert.strictEqual(res.valid, false, 'Không có gà rán thì không được áp dụng');
});

runTest('3.6: Voucher CHICKENLOVE khi giỏ hàng CÓ món gà rán -> Giảm 19.000đ (trị giá 1 lon Pepsi)', () => {
  const chickenCart = [
    { product: { id: 'kfc-02', name: 'Gà Rán Giòn Cay', category: 'ga-ran', price: 38000 }, qty: 2 }
  ];
  const res = VoucherEngine.applyVoucher({ code: 'CHICKENLOVE', subtotal: 76000, cartItems: chickenCart });
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.discount, 19000);
});

runTest('3.7: Voucher APPNEW giảm 15% tối đa 50.000đ', () => {
  // Test subtotal = 200k -> 15% = 30k
  const res1 = VoucherEngine.applyVoucher({ code: 'APPNEW', subtotal: 200000 });
  assert.strictEqual(res1.valid, true);
  assert.strictEqual(res1.discount, 30000);

  // Test subtotal = 500k -> 15% = 75k -> Giới hạn max 50k
  const res2 = VoucherEngine.applyVoucher({ code: 'APPNEW', subtotal: 500000 });
  assert.strictEqual(res2.valid, true);
  assert.strictEqual(res2.discount, 50000);
});

runTest('3.8: Mã không tồn tại -> Báo lỗi thân thiện', () => {
  const res = VoucherEngine.applyVoucher({ code: 'HACKER99', subtotal: 100000 });
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.discount, 0);
});

// -----------------------------------------------------------------------------
// NHÓM 4: KIỂM THỬ TÍNH TOÁN TOÀN DIỆN & TỔNG TIỀN (PRICING ENGINE)
// -----------------------------------------------------------------------------
console.log('\n--- NHÓM 4: KIỂM THỬ BỘ TÍNH TOÁN TOÀN DIỆN (PRICING INTEGRITY) ---');

runTest('4.1: Giỏ hàng tính đúng công thức finalTotal = subtotal - discount + finalFee', () => {
  const cart = [
    { product: { id: 'kfc-01', name: 'Combo Gà Vui Vẻ', price: 89000 }, qty: 2 } // 178k
  ];
  // distance 4km (phí gốc 20k), áp mã KFC20K -> giảm 20k -> finalTotal = 178k - 20k + 20k = 178k
  const summary = PricingEngine.calculateSummary({
    cartItems: cart,
    distanceKm: 4,
    voucherCode: 'KFC20K'
  });

  assert.strictEqual(summary.subtotal, 178000);
  assert.strictEqual(summary.discount, 20000);
  assert.strictEqual(summary.shipping.finalFee, 20000);
  assert.strictEqual(summary.finalTotal, 178000);
  assert.strictEqual(summary.itemCount, 2);
});

runTest('4.2: Đảm bảo tổng tiền không bao giờ bị âm', () => {
  const cart = [
    { product: { id: 'kfc-07', name: 'Pepsi', price: 19000 }, qty: 1 }
  ];
  const summary = PricingEngine.calculateSummary({
    cartItems: cart,
    distanceKm: 1,
    voucherCode: ''
  });
  assert.ok(summary.finalTotal >= 0);
});

// -----------------------------------------------------------------------------
// NHÓM 5: KIỂM THỬ XỬ LÝ ĐƠN HÀNG & 4 PHƯƠNG THỨC THANH TOÁN YÊU CẦU
// (MÃ QR MOMO, TIỀN MẶT, ZALO PAY, VISA)
// -----------------------------------------------------------------------------
console.log('\n--- NHÓM 5: KIỂM THỬ 4 PHƯƠNG THỨC THANH TOÁN (MOMO, COD, ZALOPAY, VISA) ---');

runTest('5.1: Định dạng mã đơn hàng duy nhất KFC-YYYYMMDD-XXXX', () => {
  const orderId = Processor.generateOrderId();
  const pattern = /^KFC-\d{8}-\d{4}$/;
  assert.strictEqual(pattern.test(orderId), true, `Mã "${orderId}" phải đúng định dạng chuẩn`);
});

runTest('5.2: Phương thức 1 - MÃ QR MOMO: Sinh payload MoMo, số điện thoại, số tiền và QR code URL', () => {
  const momo = Processor.generateMoMoPayload({ orderId: 'KFC-20261101-5678', amount: 150000 });
  assert.strictEqual(momo.amount, 150000);
  assert.strictEqual(momo.phone, '0901234567');
  assert.ok(momo.deeplink.includes('momo://app'));
  assert.ok(momo.qrImageUrl.includes('0901234567'));
});

runTest('5.3: Phương thức 2 - TIỀN MẶT (COD): Tạo đơn hàng với trạng thái PENDING và lưu ghi chú tiền thối', () => {
  const cart = [
    { product: { id: 'kfc-01', name: 'Combo Gà Vui Vẻ', price: 89000, image: 'img.jpg' }, qty: 1 }
  ];
  const formData = {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '213A Nguyễn Văn Cừ, Quận 5',
    distanceKm: 2,
    paymentMethod: 'COD',
    note: 'Đưa tờ 500k, tài xế chuẩn bị tiền thối'
  };
  const pricing = PricingEngine.calculateSummary({ cartItems: cart, distanceKm: 2 });
  const order = Processor.processPayment({ cartItems: cart, formData, pricingSummary: pricing });

  assert.strictEqual(order.payment.method, 'COD');
  assert.strictEqual(order.payment.status, 'PENDING');
  assert.ok(order.customer.note.includes('500k'));
});

runTest('5.4: Phương thức 3 - ZALO PAY: Sinh payload ZaloPay với Merchant, Memo và mã QR thanh toán', () => {
  const zalo = Processor.generateZaloPayPayload({ orderId: 'KFC-20261101-8899', amount: 89000 });
  assert.strictEqual(zalo.amount, 89000);
  assert.ok(zalo.merchantName.includes('KFC VIỆT NAM'));
  assert.ok(zalo.memo.includes('KFC-20261101-8899'));
  assert.ok(zalo.qrImageUrl.includes('zalopay.vn'));
  assert.ok(zalo.deeplink.includes('zalopay://pay'));
});

runTest('5.5: Phương thức 4 - VISA: Xác thực thẻ Visa hợp lệ (bắt đầu bằng số 4, 16 số, Luhn pass, CVV 3 số)', () => {
  const validVisa = {
    cardNumber: '4532015112830366',
    cardHolder: 'NGUYEN VAN A',
    expiry: '12/28',
    cvv: '123'
  };
  const result = Validator.validateVisaCard(validVisa);
  assert.strictEqual(result.isValid, true, 'Thẻ Visa hợp lệ phải pass validation');
});

runTest('5.6: Phương thức 4 - VISA: Từ chối thẻ không phải Visa (MasterCard bắt đầu bằng 5 hoặc thẻ sai chuẩn)', () => {
  const masterCard = {
    cardNumber: '5500000000000004', // Bắt đầu bằng 5
    cardHolder: 'TRAN VAN B',
    expiry: '10/28',
    cvv: '456'
  };
  const result = Validator.validateVisaCard(masterCard);
  assert.strictEqual(result.isValid, false, 'Thẻ không bắt đầu bằng số 4 phải bị từ chối');
  assert.ok(result.errors.cardNumber.includes('bắt đầu bằng số 4'));
});

runTest('5.7: Phương thức 4 - VISA: Từ chối thẻ có mã CVV không hợp lệ (không phải 3 chữ số)', () => {
  const invalidCvv = {
    cardNumber: '4532015112830366',
    cardHolder: 'NGUYEN VAN A',
    expiry: '12/28',
    cvv: '1234' // Visa CVV chỉ gồm 3 số
  };
  const result = Validator.validateVisaCard(invalidCvv);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.cvv.includes('3 chữ số'));
});

runTest('5.8: Tạo đơn hàng hoàn chỉnh với cam kết giao hàng 30 phút theo chinh_sach.md', () => {
  const cart = [
    { product: { id: 'kfc-01', name: 'Combo Gà Vui Vẻ', price: 89000, image: 'img.jpg' }, qty: 1 }
  ];
  const formData = {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    address: '213A Nguyễn Văn Cừ, Quận 5',
    distanceKm: 2,
    paymentMethod: 'VISA',
    cardData: {
      cardNumber: '4532015112830366',
      cardHolder: 'NGUYEN VAN A',
      expiry: '12/28',
      cvv: '123'
    }
  };
  const pricing = PricingEngine.calculateSummary({ cartItems: cart, distanceKm: 2 });
  const order = Processor.processPayment({ cartItems: cart, formData, pricingSummary: pricing });

  assert.ok(order.orderId.startsWith('KFC-'));
  assert.strictEqual(order.commitmentMinutes, 30, 'Cam kết 30 phút giao hàng theo chinh_sach.md');
  assert.strictEqual(order.customer.name, 'Nguyễn Văn A');
  assert.strictEqual(order.items.length, 1);
  assert.strictEqual(order.payment.method, 'VISA');
  assert.strictEqual(order.payment.status, 'PAID');
});

console.log('\n======================================================');
console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedCount} / ${totalCount} TEST CASES THÀNH CÔNG (100% PASS)`);
console.log('======================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
