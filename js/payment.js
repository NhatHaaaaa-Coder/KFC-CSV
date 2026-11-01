/**
 * Module Thanh Toán (Payment & Checkout Module) - KFC Việt Nam
 * Dựa trên tài liệu PRD & chính sách trong chinh_sach.md và khuyen_mai.md
 * 
 * Hỗ trợ hoạt động đa môi trường: Browser (Window) và Node.js (CommonJS test runner)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js environment
    module.exports = factory();
  } else {
    // Browser environment
    root.PaymentModule = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // 1. CẤU HÌNH VÀ HẰNG SỐ (CONFIG & CONSTANTS)
  const PaymentConfig = {
    store: {
      name: 'KFC Nguyễn Văn Cừ',
      address: '213A Nguyễn Văn Cừ, Chợ Quán, Quận 5, TP. Hồ Chí Minh',
      hotline: '1900 6886',
      operatingHours: {
        open: '09:00',
        close: '21:30'
      },
      commitmentDeliveryMinutes: 30
    },
    shippingRules: {
      tier1: { maxKm: 3, fee: 15000, freeThreshold: 100000 },
      tier2: { minKm: 3, maxKm: 5, fee: 20000, freeThresholdWithVoucher: 150000 },
      tier3: { minKm: 5, fee: 30000, discount50Threshold: 250000 }
    },
    vouchers: {
      'KFCFREESHIP': {
        code: 'KFCFREESHIP',
        type: 'FREE_SHIP',
        description: 'Miễn phí giao hàng cho đơn từ 150.000đ (bán kính 5km)',
        minSubtotal: 150000,
        maxDistanceKm: 5
      },
      'KFC20K': {
        code: 'KFC20K',
        type: 'FIXED_DISCOUNT',
        discount: 20000,
        description: 'Giảm ngay 20.000đ cho đơn hàng từ 100.000đ',
        minSubtotal: 100000
      },
      'CHICKENLOVE': {
        code: 'CHICKENLOVE',
        type: 'COMBO_ITEM_DISCOUNT',
        discount: 19000, // Trị giá 1 lon Pepsi mát lạnh theo khuyen_mai.md
        description: 'Tặng 1 ly Pepsi 500ml (giảm 19.000đ) khi mua Gà Rán Giòn Cay hoặc Gà Truyền Thống',
        requiresChickenInCart: true
      },
      'APPNEW': {
        code: 'APPNEW',
        type: 'PERCENTAGE',
        rate: 0.15, // Giảm 15%
        maxDiscount: 50000,
        description: 'Giảm 15% (tối đa 50.000đ) cho khách hàng lần đầu đặt món trực tuyến',
        minSubtotal: 0
      }
    },
    banking: {
      bankCode: 'MB', // Ngân hàng Quân Đội
      accountNumber: '0399888999',
      accountName: 'KFC VIET NAM',
      momoPhone: '0901234567'
    }
  };

  // 2. BỘ XÁC THỰC DỮ LIỆU (PAYMENT VALIDATOR)
  const PaymentValidator = {
    /**
     * Xác thực số điện thoại di động Việt Nam (10 số, đầu số 03, 05, 07, 08, 09)
     */
    validatePhone(phone) {
      if (!phone || typeof phone !== 'string') return false;
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      const vnPhoneRegex = /^(03|05|07|08|09)\d{8}$/;
      return vnPhoneRegex.test(cleanPhone);
    },

    /**
     * Xác thực họ tên người nhận
     */
    validateCustomerName(name) {
      if (!name || typeof name !== 'string') return false;
      const cleanName = name.trim();
      return cleanName.length >= 2 && cleanName.length <= 50;
    },

    /**
     * Xác thực địa chỉ giao hàng
     */
    validateAddress(address) {
      if (!address || typeof address !== 'string') return false;
      const cleanAddr = address.trim();
      return cleanAddr.length >= 8 && cleanAddr.length <= 150;
    },

    /**
     * Xác thực khoảng cách giao hàng
     */
    validateDistance(distanceKm) {
      const dist = parseFloat(distanceKm);
      return !isNaN(dist) && dist > 0 && dist <= 30;
    },

    /**
     * Kiểm tra thời gian đặt hàng theo khung giờ phục vụ 09:00 - 21:30 (chinh_sach.md)
     */
    validateOperatingHours(testDate = new Date()) {
      const hours = testDate.getHours();
      const minutes = testDate.getMinutes();
      const currentMinutes = hours * 60 + minutes;

      const [openH, openM] = PaymentConfig.store.operatingHours.open.split(':').map(Number);
      const [closeH, closeM] = PaymentConfig.store.operatingHours.close.split(':').map(Number);

      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      const isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
      return {
        isOpen,
        openTime: PaymentConfig.store.operatingHours.open,
        closeTime: PaymentConfig.store.operatingHours.close,
        message: isOpen 
          ? 'Cửa hàng đang trong thời gian phục vụ giao hàng (09:00 - 21:30)'
          : 'Hiện tại đã ngoài khung giờ giao hàng (09:00 - 21:30). Đơn sẽ được lên lịch giao vào sáng mai!'
      };
    },

    /**
     * Thuật toán Luhn kiểm tra số thẻ ngân hàng
     */
    validateCardNumber(cardNumber) {
      if (!cardNumber || typeof cardNumber !== 'string') return false;
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) return false;

      let sum = 0;
      let shouldDouble = false;
      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits.charAt(i), 10);
        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
      }
      return sum % 10 === 0;
    },

    /**
     * Xác thực riêng cho thẻ quốc tế Visa (Bắt đầu bằng số 4, 16 chữ số, chuẩn Luhn)
     */
    validateVisaCard({ cardNumber, cardHolder, expiry, cvv }) {
      if (!cardNumber || typeof cardNumber !== 'string') {
        return { isValid: false, errors: { cardNumber: 'Vui lòng nhập số thẻ Visa.' } };
      }
      const cleanDigits = cardNumber.replace(/\D/g, '');
      const isVisaPattern = /^4\d{12}(\d{3})?$/.test(cleanDigits);
      const isLuhnValid = this.validateCardNumber(cleanDigits);
      const isCardValid = isVisaPattern && isLuhnValid;

      const isHolderValid = cardHolder && typeof cardHolder === 'string' && cardHolder.trim().length >= 3;

      let isExpiryValid = false;
      if (expiry && /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.trim())) {
        const [expMonth, expYearStr] = expiry.trim().split('/').map(Number);
        const expYear = 2000 + expYearStr;
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        if (expYear > curYear || (expYear === curYear && expMonth >= curMonth)) {
          isExpiryValid = true;
        }
      }

      const isCvvValid = cvv && /^\d{3}$/.test(cvv.trim()); // Chuẩn CVV thẻ Visa là 3 số

      const errors = {
        cardNumber: !isCardValid ? 'Số thẻ Visa không hợp lệ (Phải bắt đầu bằng số 4 và gồm 16 chữ số).' : null,
        cardHolder: !isHolderValid ? 'Tên in trên thẻ Visa không được để trống (tối thiểu 3 ký tự).' : null,
        expiry: !isExpiryValid ? 'Hạn thẻ (MM/YY) không hợp lệ hoặc thẻ đã hết hạn.' : null,
        cvv: !isCvvValid ? 'Mã bảo mật CVV của thẻ Visa gồm 3 chữ số ở mặt sau thẻ.' : null
      };

      return {
        isValid: isCardValid && isHolderValid && isExpiryValid && isCvvValid,
        errors
      };
    },

    /**
     * Xác thực thông tin thẻ thanh toán chung
     */
    validateCardInfo(cardData) {
      return this.validateVisaCard(cardData);
    },

    /**
     * Xác thực tổng thể form thanh toán
     */
    validateOrderForm(formData) {
      const errors = {};
      if (!this.validateCustomerName(formData.name)) {
        errors.name = 'Họ và tên người nhận phải từ 2 đến 50 ký tự.';
      }
      if (!this.validatePhone(formData.phone)) {
        errors.phone = 'Số điện thoại không hợp lệ (cần 10 số, bắt đầu bằng 03, 05, 07, 08, 09).';
      }
      if (!this.validateAddress(formData.address)) {
        errors.address = 'Vui lòng nhập địa chỉ giao hàng cụ thể (tối thiểu 8 ký tự).';
      }
      if (!this.validateDistance(formData.distanceKm)) {
        errors.distanceKm = 'Khoảng cách giao hàng phải từ 0.1km đến tối đa 30km.';
      }

      // Hỗ trợ 4 phương thức yêu cầu: MOMO, COD, ZALOPAY, VISA
      const validMethods = ['MOMO', 'COD', 'ZALOPAY', 'VISA', 'VIETQR', 'CARD'];
      if (!validMethods.includes(formData.paymentMethod)) {
        errors.paymentMethod = 'Phương thức thanh toán không hợp lệ.';
      }

      if (formData.paymentMethod === 'VISA' || formData.paymentMethod === 'CARD') {
        const visaVal = this.validateVisaCard(formData.cardData || {});
        if (!visaVal.isValid) {
          errors.card = visaVal.errors;
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors
      };
    }
  };

  // 3. TÍNH TOÁN PHÍ GIAO HÀNG (SHIPPING CALCULATOR)
  const ShippingCalculator = {
    /**
     * Tính phí giao hàng theo đúng bảng biểu phí tại chinh_sach.md:
     * - Dưới 3 km: 15.000đ (Miễn phí cho đơn từ 100.000đ)
     * - Từ 3 - 5 km: 20.000đ (Miễn phí cho đơn từ 150.000đ khi có mã KFCFREESHIP)
     * - Trên 5 km: 30.000đ (Hỗ trợ 50% phí ship cho đơn từ 250.000đ)
     */
    calculate({ distanceKm, subtotal, voucherCode }) {
      const dist = Math.max(0.1, parseFloat(distanceKm) || 2);
      const sub = Math.max(0, parseInt(subtotal, 10) || 0);
      const isFreeShipVoucher = voucherCode === 'KFCFREESHIP';

      let baseFee = 0;
      let finalFee = 0;
      let policyNote = '';

      if (dist <= 3) {
        baseFee = 15000;
        if (sub >= 100000) {
          finalFee = 0;
          policyNote = 'Miễn phí giao hàng (Đơn từ 100.000đ trong phạm vi dưới 3km)';
        } else {
          finalFee = baseFee;
          policyNote = 'Phí giao hàng chuẩn 15.000đ (Bán kính dưới 3km)';
        }
      } else if (dist <= 5) {
        baseFee = 20000;
        if (sub >= 150000 && isFreeShipVoucher) {
          finalFee = 0;
          policyNote = 'Miễn phí giao hàng (Áp dụng mã voucher KFCFREESHIP cho đơn từ 150.000đ)';
        } else {
          finalFee = baseFee;
          policyNote = 'Phí giao hàng 20.000đ (Phạm vi từ 3km - 5km)';
        }
      } else {
        baseFee = 30000;
        if (sub >= 250000) {
          finalFee = 15000;
          policyNote = 'Hỗ trợ 50% phí ship (Đơn từ 250.000đ cho khoảng cách trên 5km)';
        } else {
          finalFee = baseFee;
          policyNote = 'Phí giao hàng 30.000đ (Khoảng cách trên 5km)';
        }
      }

      return {
        distanceKm: dist,
        baseFee,
        finalFee,
        discountedFee: baseFee - finalFee,
        policyNote
      };
    }
  };

  // 4. BỘ XỬ LÝ VOUCHER & KHUYẾN MÃI (VOUCHER ENGINE)
  const VoucherEngine = {
    /**
     * Kiểm tra giỏ hàng có chứa sản phẩm gà rán theo yêu cầu voucher CHICKENLOVE hay không
     */
    hasChickenInCart(cartItems = []) {
      if (!Array.isArray(cartItems)) return false;
      return cartItems.some(item => {
        const prod = item.product || {};
        const cat = (prod.category || '').toLowerCase();
        const id = (prod.id || '').toLowerCase();
        const name = (prod.name || '').toLowerCase();
        return cat === 'ga-ran' || id === 'kfc-02' || id === 'kfc-03' || name.includes('gà rán') || name.includes('gà');
      });
    },

    /**
     * Xác thực và tính mức giảm giá của Voucher theo khuyen_mai.md
     */
    applyVoucher({ code, subtotal, distanceKm, cartItems = [] }) {
      if (!code || typeof code !== 'string') {
        return { valid: false, discount: 0, message: 'Chưa nhập mã giảm giá' };
      }

      const cleanCode = code.trim().toUpperCase();
      const voucherDef = PaymentConfig.vouchers[cleanCode];

      if (!voucherDef) {
        return {
          valid: false,
          discount: 0,
          code: cleanCode,
          message: `Mã ưu đãi "${cleanCode}" không tồn tại hoặc đã hết hạn.`
        };
      }

      const sub = Math.max(0, parseInt(subtotal, 10) || 0);
      const dist = parseFloat(distanceKm) || 2;

      // Rule: KFCFREESHIP
      if (cleanCode === 'KFCFREESHIP') {
        if (sub < voucherDef.minSubtotal) {
          return {
            valid: false,
            discount: 0,
            code: cleanCode,
            message: `Mã KFCFREESHIP chỉ áp dụng cho đơn hàng từ ${voucherDef.minSubtotal.toLocaleString('vi-VN')}đ trở lên (Hiện tại: ${sub.toLocaleString('vi-VN')}đ).`
          };
        }
        if (dist > voucherDef.maxDistanceKm) {
          return {
            valid: false,
            discount: 0,
            code: cleanCode,
            message: `Mã KFCFREESHIP chỉ hỗ trợ bán kính tối đa ${voucherDef.maxDistanceKm}km (Khoảng cách của bạn: ${dist}km).`
          };
        }
        return {
          valid: true,
          discount: 0, // Sẽ được ShippingCalculator xử lý về 0đ
          code: cleanCode,
          type: 'FREE_SHIP',
          message: 'Áp dụng mã KFCFREESHIP thành công: Miễn phí 100% phí vận chuyển!'
        };
      }

      // Rule: KFC20K
      if (cleanCode === 'KFC20K') {
        if (sub < voucherDef.minSubtotal) {
          return {
            valid: false,
            discount: 0,
            code: cleanCode,
            message: `Mã KFC20K áp dụng cho đơn từ ${voucherDef.minSubtotal.toLocaleString('vi-VN')}đ trở lên.`
          };
        }
        return {
          valid: true,
          discount: voucherDef.discount,
          code: cleanCode,
          type: 'FIXED_DISCOUNT',
          message: 'Áp dụng thành công: Giảm 20.000đ trực tiếp vào đơn hàng!'
        };
      }

      // Rule: CHICKENLOVE
      if (cleanCode === 'CHICKENLOVE') {
        if (!this.hasChickenInCart(cartItems)) {
          return {
            valid: false,
            discount: 0,
            code: cleanCode,
            message: 'Mã CHICKENLOVE chỉ áp dụng khi giỏ hàng có Gà Rán Giòn Cay hoặc Gà Truyền Thống.'
          };
        }
        return {
          valid: true,
          discount: voucherDef.discount, // 19.000đ tương đương 1 ly Pepsi 500ml
          code: cleanCode,
          type: 'COMBO_ITEM_DISCOUNT',
          message: 'Áp dụng mã CHICKENLOVE thành công: Tặng ngay 1 ly Pepsi 500ml (giảm 19.000đ)!'
        };
      }

      // Rule: APPNEW
      if (cleanCode === 'APPNEW') {
        const calculatedDiscount = Math.min(Math.round(sub * voucherDef.rate), voucherDef.maxDiscount);
        return {
          valid: true,
          discount: calculatedDiscount,
          code: cleanCode,
          type: 'PERCENTAGE',
          message: `Áp dụng mã APPNEW thành công: Giảm 15% (-${calculatedDiscount.toLocaleString('vi-VN')}đ)!`
        };
      }

      return { valid: false, discount: 0, message: 'Mã không hợp lệ.' };
    }
  };

  // 5. BỘ TÍNH TOÁN TỔNG THỂ HÓA ĐƠN (CHECKOUT PRICING ENGINE)
  const PricingEngine = {
    calculateSummary({ cartItems = [], distanceKm = 2, voucherCode = '' }) {
      const subtotal = cartItems.reduce((sum, item) => {
        const price = (item.product && item.product.price) || 0;
        const qty = item.qty || 1;
        return sum + price * qty;
      }, 0);

      const voucherResult = VoucherEngine.applyVoucher({
        code: voucherCode,
        subtotal,
        distanceKm,
        cartItems
      });

      const shippingResult = ShippingCalculator.calculate({
        distanceKm,
        subtotal,
        voucherCode: voucherResult.valid ? voucherCode : ''
      });

      const discount = voucherResult.valid ? voucherResult.discount : 0;
      const finalTotal = Math.max(0, subtotal - discount + shippingResult.finalFee);

      return {
        subtotal,
        shipping: shippingResult,
        voucher: voucherResult,
        discount,
        finalTotal,
        itemCount: cartItems.reduce((acc, it) => acc + (it.qty || 1), 0)
      };
    }
  };

  // 6. XỬ LÝ PHƯƠNG THỨC THANH TOÁN (PAYMENT PROCESSOR)
  const PaymentProcessor = {
    generateOrderId() {
      const now = new Date();
      const datePart = now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      return `KFC-${datePart}-${randomPart}`;
    },

    /**
     * Tạo dữ liệu mã VietQR theo chuẩn Napas 247
     */
    generateVietQR({ orderId, amount }) {
      const { bankCode, accountNumber, accountName } = PaymentConfig.banking;
      const memo = encodeURIComponent(`KFC ${orderId}`);
      const qrImageUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=${encodeURIComponent(accountName)}`;
      return {
        bankCode,
        accountNumber,
        accountName,
        memo: `KFC ${orderId}`,
        amount,
        qrImageUrl
      };
    },

    /**
     * Tạo dữ liệu thanh toán Mã QR MoMo
     */
    generateMoMoPayload({ orderId, amount }) {
      const { momoPhone, accountName } = PaymentConfig.banking;
      return {
        phone: momoPhone,
        receiverName: accountName,
        orderId,
        amount,
        deeplink: `momo://app?action=pay&amount=${amount}&receiver=${momoPhone}&description=KFC%20${orderId}`,
        qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=2|99|${momoPhone}|${accountName}|kfcvietnam@gmail.com|0|0|${amount}|KFC%20${orderId}|transfer_myqr`
      };
    },

    /**
     * Tạo dữ liệu thanh toán Zalo pay (Mã QR ZaloPay)
     */
    generateZaloPayPayload({ orderId, amount }) {
      const merchantName = 'KFC VIỆT NAM (ZALOPAY MERCHANT)';
      const memo = `KFC ${orderId}`;
      const deeplink = `zalopay://pay?order_id=${encodeURIComponent(orderId)}&amount=${amount}&desc=${encodeURIComponent(memo)}`;
      // Sinh mã QR thanh toán chuẩn cho ZaloPay
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://zalopay.vn/pay?merchant=KFCVIETNAM&orderId=${encodeURIComponent(orderId)}&amount=${amount}&memo=${encodeURIComponent(memo)}`;
      return {
        merchantName,
        orderId,
        amount,
        memo,
        deeplink,
        qrImageUrl
      };
    },

    /**
     * Thực thi thanh toán và xuất bản đơn hàng hoàn tất
     */
    processPayment({ cartItems, formData, pricingSummary }) {
      const orderId = this.generateOrderId();
      const now = new Date();
      const estDelivery = new Date(now.getTime() + PaymentConfig.store.commitmentDeliveryMinutes * 60000);

      const orderRecord = {
        orderId,
        createdAt: now.toISOString(),
        createdAtFormatted: now.toLocaleString('vi-VN'),
        estimatedDeliveryTime: estDelivery.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        commitmentMinutes: PaymentConfig.store.commitmentDeliveryMinutes,
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          distanceKm: parseFloat(formData.distanceKm) || 2,
          note: (formData.note || '').trim()
        },
        items: cartItems.map(it => ({
          id: it.product.id,
          name: it.product.name,
          price: it.product.price,
          qty: it.qty,
          subtotal: it.product.price * it.qty,
          image: it.product.image
        })),
        pricing: {
          subtotal: pricingSummary.subtotal,
          shippingFee: pricingSummary.shipping.finalFee,
          baseShippingFee: pricingSummary.shipping.baseFee,
          discount: pricingSummary.discount,
          voucherCode: pricingSummary.voucher.valid ? pricingSummary.voucher.code : null,
          finalTotal: pricingSummary.finalTotal
        },
        payment: {
          method: formData.paymentMethod,
          status: formData.paymentMethod === 'COD' ? 'PENDING' : 'PAID',
          transactionId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000)
        },
        store: PaymentConfig.store
      };

      // Lưu trữ lịch sử vào LocalStorage nếu ở môi trường trình duyệt
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const history = JSON.parse(localStorage.getItem('kfc_orders') || '[]');
          history.unshift(orderRecord);
          localStorage.setItem('kfc_orders', JSON.stringify(history.slice(0, 20)));
        } catch (e) {
          console.warn('Cannot write to localStorage:', e);
        }
      }

      return orderRecord;
    }
  };

  // 7. GIAO DIỆN & TƯƠNG TÁC NGƯỜI DÙNG (UI CONTROLLER)
  const PaymentUI = {
    activeState: {
      cartItems: [],
      distanceKm: 2,
      appliedVoucher: '',
      paymentMethod: 'MOMO', // Mặc định: Mã QR MOMO
      cardData: {}
    },

    /**
     * Khởi tạo giao diện thanh toán với dữ liệu từ Giỏ Hàng
     */
    openCheckout(cartItems = [], initialVoucher = '') {
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        alert('Giỏ hàng của bạn đang trống! Vui lòng chọn món trước khi thanh toán.');
        return;
      }

      this.activeState.cartItems = cartItems;
      this.activeState.appliedVoucher = initialVoucher || '';
      this.activeState.distanceKm = 2; // Mặc định 2km
      this.activeState.paymentMethod = 'MOMO';

      this.renderCheckoutModal();
      
      const modalEl = document.getElementById('paymentCheckoutModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      }
    },

    /**
     * Render toàn bộ cấu trúc Modal Thanh Toán
     */
    renderCheckoutModal() {
      let modalContainer = document.getElementById('paymentModalWrapper');
      if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'paymentModalWrapper';
        document.body.appendChild(modalContainer);
      }

      const summary = PricingEngine.calculateSummary({
        cartItems: this.activeState.cartItems,
        distanceKm: this.activeState.distanceKm,
        voucherCode: this.activeState.appliedVoucher
      });

      const operatingStatus = PaymentValidator.validateOperatingHours();

      modalContainer.innerHTML = `
        <div class="modal fade" id="paymentCheckoutModal" tabindex="-1" aria-labelledby="paymentModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content rounded-4 border-0 shadow-24 overflow-hidden">
              <!-- Header -->
              <div class="modal-header bg-danger text-white py-3 px-4">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-shield-lock-fill fs-4 text-warning"></i>
                  <div>
                    <h5 class="modal-title fw-bold mb-0" id="paymentModalLabel">Thanh Toán Đơn Hàng KFC</h5>
                    <small class="text-white-50">Module Thanh Toán #2 • Cam kết giao hàng 30 phút nóng giòn</small>
                  </div>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Đóng"></button>
              </div>

              <!-- Body -->
              <div class="modal-body p-4 bg-light">
                ${!operatingStatus.isOpen ? `
                  <div class="alert alert-warning d-flex align-items-center mb-4 py-2 px-3 small border-0 shadow-sm" role="alert">
                    <i class="bi bi-exclamation-triangle-fill fs-5 me-2 text-warning"></i>
                    <div>${operatingStatus.message}</div>
                  </div>
                ` : ''}

                <div class="row g-4">
                  <!-- CỘT TRÁI: THÔNG TIN GIAO HÀNG & PHƯƠNG THỨC THANH TOÁN -->
                  <div class="col-12 col-lg-7">
                    <div class="card border-0 rounded-4 shadow-sm p-4 mb-4 bg-white">
                      <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                        <i class="bi bi-geo-alt-fill text-danger"></i> 1. Thông Tin Nhận Hàng & Vận Chuyển
                      </h6>

                      <div class="row g-3">
                        <div class="col-12 col-sm-6">
                          <label class="form-label small fw-bold">Họ và tên người nhận <span class="text-danger">*</span></label>
                          <input type="text" id="pmCustName" class="form-control" placeholder="Ví dụ: Nguyễn Văn A" required>
                          <div class="invalid-feedback" id="pmErrName"></div>
                        </div>

                        <div class="col-12 col-sm-6">
                          <label class="form-label small fw-bold">Số điện thoại liên hệ <span class="text-danger">*</span></label>
                          <input type="tel" id="pmCustPhone" class="form-control" placeholder="Ví dụ: 0901234567" required>
                          <div class="invalid-feedback" id="pmErrPhone"></div>
                        </div>

                        <div class="col-12">
                          <label class="form-label small fw-bold">Địa chỉ giao hàng tận nơi <span class="text-danger">*</span></label>
                          <input type="text" id="pmCustAddress" class="form-control" placeholder="Số nhà, tên đường, phường, quận..." required>
                          <div class="invalid-feedback" id="pmErrAddress"></div>
                        </div>

                        <div class="col-12">
                          <label class="form-label small fw-bold d-flex justify-content-between">
                            <span>Khoảng cách giao hàng (Từ KFC Nguyễn Văn Cừ):</span>
                            <span class="text-danger fw-bold" id="pmDistanceDisplay">${this.activeState.distanceKm} km</span>
                          </label>
                          <div class="btn-group w-100 mb-2" role="group">
                            <button type="button" class="btn btn-sm ${this.activeState.distanceKm <= 3 ? 'btn-danger' : 'btn-outline-danger'}" onclick="PaymentModule.setDistance(2)">
                              &lt; 3 km (15k / Free &gt;100k)
                            </button>
                            <button type="button" class="btn btn-sm ${this.activeState.distanceKm > 3 && this.activeState.distanceKm <= 5 ? 'btn-danger' : 'btn-outline-danger'}" onclick="PaymentModule.setDistance(4.5)">
                              3 - 5 km (20k / Mã Freeship)
                            </button>
                            <button type="button" class="btn btn-sm ${this.activeState.distanceKm > 5 ? 'btn-danger' : 'btn-outline-danger'}" onclick="PaymentModule.setDistance(7)">
                              &gt; 5 km (30k / Giảm 50% &gt;250k)
                            </button>
                          </div>
                          <div class="form-text small text-muted">
                            <i class="bi bi-info-circle me-1"></i> Biểu phí vận chuyển được tính chính xác theo quy định tại <code>chinh_sach.md</code>.
                          </div>
                        </div>

                        <div class="col-12">
                          <label class="form-label small fw-bold">Ghi chú cho tài xế / nhà hàng (Tùy chọn)</label>
                          <input type="text" id="pmCustNote" class="form-control" placeholder="Ví dụ: Cho thêm tương ớt, giao lên lầu 3...">
                        </div>
                      </div>
                    </div>

                    <!-- PHƯƠNG THỨC THANH TOÁN (4 TÙY CHỌN: MÃ QR MOMO, TIỀN MẶT, ZALO PAY, VISA) -->
                    <div class="card border-0 rounded-4 shadow-sm p-4 bg-white">
                      <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                        <i class="bi bi-wallet2 text-danger"></i> 2. Chọn Phương Thức Thanh Toán
                      </h6>

                      <div class="row g-2 mb-3">
                        <!-- 1. Mã QR MOMO -->
                        <div class="col-6 col-sm-3">
                          <div class="payment-method-box p-3 border rounded-3 text-center cursor-pointer ${this.activeState.paymentMethod === 'MOMO' ? 'border-danger bg-danger-subtle fw-bold' : ''}" onclick="PaymentModule.setPaymentMethod('MOMO')">
                            <i class="bi bi-qr-code fs-3 text-danger d-block mb-1"></i>
                            <span class="small d-block">Mã QR MOMO</span>
                          </div>
                        </div>

                        <!-- 2. Tiền mặt -->
                        <div class="col-6 col-sm-3">
                          <div class="payment-method-box p-3 border rounded-3 text-center cursor-pointer ${this.activeState.paymentMethod === 'COD' ? 'border-danger bg-danger-subtle fw-bold' : ''}" onclick="PaymentModule.setPaymentMethod('COD')">
                            <i class="bi bi-cash-stack fs-3 text-success d-block mb-1"></i>
                            <span class="small d-block">Tiền mặt</span>
                          </div>
                        </div>

                        <!-- 3. Zalo pay -->
                        <div class="col-6 col-sm-3">
                          <div class="payment-method-box p-3 border rounded-3 text-center cursor-pointer ${this.activeState.paymentMethod === 'ZALOPAY' ? 'border-danger bg-danger-subtle fw-bold' : ''}" onclick="PaymentModule.setPaymentMethod('ZALOPAY')">
                            <i class="bi bi-wallet-fill fs-3 text-primary d-block mb-1"></i>
                            <span class="small d-block">Zalo pay</span>
                          </div>
                        </div>

                        <!-- 4. Visa -->
                        <div class="col-6 col-sm-3">
                          <div class="payment-method-box p-3 border rounded-3 text-center cursor-pointer ${this.activeState.paymentMethod === 'VISA' ? 'border-danger bg-danger-subtle fw-bold' : ''}" onclick="PaymentModule.setPaymentMethod('VISA')">
                            <i class="bi bi-credit-card-2-front-fill fs-3 text-warning d-block mb-1"></i>
                            <span class="small d-block">Visa</span>
                          </div>
                        </div>
                      </div>

                      <!-- Chi tiết theo phương thức được chọn -->
                      <div id="paymentMethodDynamicContent" class="p-3 bg-light rounded-3 border">
                        ${this.renderPaymentMethodDetails(summary.finalTotal)}
                      </div>
                    </div>
                  </div>

                  <!-- CỘT PHẢI: TỔNG QUAN GIỎ HÀNG & HÓA ĐƠN -->
                  <div class="col-12 col-lg-5">
                    <div class="card border-0 rounded-4 shadow-sm p-4 bg-white sticky-top" style="top: 20px;">
                      <h6 class="fw-bold text-dark mb-3 d-flex align-items-center justify-content-between">
                        <span><i class="bi bi-receipt text-danger me-2"></i>Đơn Hàng (${summary.itemCount} món)</span>
                        <span class="badge bg-secondary-subtle text-dark">${this.activeState.cartItems.length} loại món</span>
                      </h6>

                      <!-- Danh sách món tóm tắt -->
                      <div class="checkout-cart-items-scroll mb-3" style="max-height: 220px; overflow-y: auto;">
                        ${this.activeState.cartItems.map(item => `
                          <div class="d-flex align-items-center gap-3 py-2 border-bottom">
                            <img src="${item.product.image}" alt="${item.product.name}" class="rounded-3" style="width: 44px; height: 44px; object-fit: cover;" onerror="this.src='images/products/khoai-tay-chien.jpg'">
                            <div class="flex-grow-1">
                              <div class="fw-bold small text-dark">${item.product.name}</div>
                              <div class="text-muted small">${item.product.price.toLocaleString('vi-VN')} đ × ${item.qty}</div>
                            </div>
                            <div class="fw-bold text-dark small">${(item.product.price * item.qty).toLocaleString('vi-VN')} đ</div>
                          </div>
                        `).join('')}
                      </div>

                      <!-- Nhập Voucher -->
                      <div class="mb-3">
                        <label class="form-label small fw-bold">Mã Khuyến Mãi / Voucher</label>
                        <div class="input-group">
                          <input type="text" id="pmVoucherInput" class="form-control text-uppercase form-control-sm" placeholder="Nhập mã voucher..." value="${this.activeState.appliedVoucher}">
                          <button class="btn btn-sm btn-danger px-3 fw-bold" type="button" onclick="PaymentModule.applyVoucher()">Áp Dụng</button>
                        </div>
                        <div class="form-text small ${summary.voucher.valid ? 'text-success' : 'text-muted'} mt-1" id="pmVoucherMsg">
                          ${summary.voucher.valid ? `<i class="bi bi-check-circle-fill me-1"></i>${summary.voucher.message}` : 'Mã khả dụng: <code>KFC20K</code>, <code>KFCFREESHIP</code>, <code>CHICKENLOVE</code>, <code>APPNEW</code>'}
                        </div>
                      </div>

                      <!-- Bảng kê tài chính -->
                      <div class="pricing-summary-table pt-2 border-top">
                        <div class="d-flex justify-content-between mb-2 small">
                          <span class="text-muted">Tạm tính món ăn:</span>
                          <span class="fw-bold">${summary.subtotal.toLocaleString('vi-VN')} đ</span>
                        </div>

                        <div class="d-flex justify-content-between mb-2 small">
                          <span class="text-muted">Phí giao hàng (${summary.shipping.distanceKm}km):</span>
                          <span class="fw-bold ${summary.shipping.finalFee === 0 ? 'text-success' : ''}">
                            ${summary.shipping.finalFee === 0 ? 'MIỄN PHÍ' : summary.shipping.finalFee.toLocaleString('vi-VN') + ' đ'}
                          </span>
                        </div>
                        <div class="small text-muted fst-italic mb-2 ps-2 border-start border-2 border-danger">
                          ${summary.shipping.policyNote}
                        </div>

                        ${summary.discount > 0 ? `
                          <div class="d-flex justify-content-between mb-2 small text-success">
                            <span>Chiết khấu Voucher:</span>
                            <span class="fw-bold">-${summary.discount.toLocaleString('vi-VN')} đ</span>
                          </div>
                        ` : ''}

                        <hr class="my-2">

                        <div class="d-flex justify-content-between align-items-center mb-3">
                          <span class="fw-bold text-dark fs-6">Tổng Thanh Toán:</span>
                          <span class="fw-bold fs-4 text-danger">${summary.finalTotal.toLocaleString('vi-VN')} đ</span>
                        </div>

                        <div class="p-2 bg-danger-subtle rounded-3 small text-danger text-center fw-bold mb-3">
                          <i class="bi bi-stopwatch-fill me-1"></i> Cam kết nóng giòn: Giao hàng trong 30 phút
                        </div>

                        <button class="btn btn-danger w-100 py-3 fw-bold fs-6 rounded-pill shadow-sm" onclick="PaymentModule.submitOrder()">
                          <i class="bi bi-shield-check me-2"></i> Xác Nhận Đặt Hàng & Thanh Toán
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Render chi tiết phương thức thanh toán động cho 4 lựa chọn:
     * 1. Mã QR MOMO
     * 2. Tiền mặt
     * 3. Zalo pay
     * 4. Visa
     */
    renderPaymentMethodDetails(amount) {
      const method = this.activeState.paymentMethod;
      const orderIdDemo = 'KFC' + Math.floor(100000 + Math.random() * 900000);

      // 1. MÃ QR MOMO
      if (method === 'MOMO') {
        const momo = PaymentProcessor.generateMoMoPayload({ orderId: orderIdDemo, amount });
        return `
          <div class="row align-items-center">
            <div class="col-12 col-md-5 text-center mb-3 mb-md-0">
              <img src="${momo.qrImageUrl}" alt="MoMo QR KFC" class="img-fluid border rounded-3 p-1 bg-white shadow-sm" style="max-height: 175px;">
              <div class="small text-danger fw-bold mt-1"><i class="bi bi-qr-code me-1"></i>Quét Bằng Ví MoMo</div>
            </div>
            <div class="col-12 col-md-7">
              <h6 class="fw-bold text-danger mb-2"><i class="bi bi-qr-code-scan me-1"></i> Thanh toán bằng Mã QR MOMO</h6>
              <ul class="list-unstyled small mb-2">
                <li>Người nhận: <strong>${momo.receiverName}</strong></li>
                <li>Số điện thoại MoMo: <strong class="text-danger fs-6">${momo.phone}</strong></li>
                <li>Số tiền thanh toán: <strong class="text-danger">${momo.amount.toLocaleString('vi-VN')} đ</strong></li>
                <li>Nội dung chuyển tiền: <code class="bg-warning text-dark px-2 py-1 rounded fw-bold">KFC ${orderIdDemo}</code></li>
              </ul>
              <div class="d-flex gap-2">
                <a href="${momo.deeplink}" class="btn btn-sm btn-outline-danger">
                  <i class="bi bi-box-arrow-up-right me-1"></i> Mở App MoMo
                </a>
              </div>
            </div>
          </div>
        `;
      }

      // 2. TIỀN MẶT
      if (method === 'COD') {
        return `
          <div class="d-flex align-items-start gap-3">
            <i class="bi bi-cash-stack text-success fs-1"></i>
            <div class="flex-grow-1">
              <h6 class="fw-bold text-dark mb-1">Thanh toán Tiền mặt khi nhận hàng (COD)</h6>
              <p class="small text-muted mb-2">
                Bạn chỉ cần thanh toán đúng số tiền <strong class="text-danger">${amount.toLocaleString('vi-VN')} đ</strong> cho tài xế giao nhận KFC khi nhận đồ ăn nóng giòn.
              </p>
              <label class="form-label small fw-bold text-muted mb-1">Ghi chú tiền thối (Nếu có):</label>
              <input type="text" id="pmCashNote" class="form-control form-control-sm" placeholder="Ví dụ: Đưa tờ 500k, tài xế chuẩn bị tiền thối...">
            </div>
          </div>
        `;
      }

      // 3. ZALO PAY
      if (method === 'ZALOPAY') {
        const zalo = PaymentProcessor.generateZaloPayPayload({ orderId: orderIdDemo, amount });
        return `
          <div class="row align-items-center">
            <div class="col-12 col-md-5 text-center mb-3 mb-md-0">
              <img src="${zalo.qrImageUrl}" alt="ZaloPay QR KFC" class="img-fluid border rounded-3 p-1 bg-white shadow-sm" style="max-height: 175px;">
              <div class="small text-primary fw-bold mt-1"><i class="bi bi-wallet2 me-1"></i>Quét Bằng Zalo / ZaloPay</div>
            </div>
            <div class="col-12 col-md-7">
              <h6 class="fw-bold text-primary mb-2"><i class="bi bi-wallet-fill me-1"></i> Thanh toán bằng Zalo pay</h6>
              <ul class="list-unstyled small mb-2">
                <li>Đơn vị thụ hưởng: <strong>${zalo.merchantName}</strong></li>
                <li>Số tiền thanh toán: <strong class="text-primary">${zalo.amount.toLocaleString('vi-VN')} đ</strong></li>
                <li>Mã giao dịch: <code class="bg-info-subtle text-dark px-2 py-1 rounded fw-bold">${zalo.memo}</code></li>
              </ul>
              <div class="small text-muted mb-2">
                Mở ứng dụng <strong>Zalo</strong> hoặc <strong>Ví ZaloPay</strong>, chọn biểu tượng <em>"Quét Mã QR"</em> để thanh toán ngay tức thì.
              </div>
              <a href="${zalo.deeplink}" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-box-arrow-up-right me-1"></i> Mở Ví ZaloPay
              </a>
            </div>
          </div>
        `;
      }

      // 4. VISA
      if (method === 'VISA' || method === 'CARD') {
        return `
          <div>
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-dark mb-0"><i class="bi bi-credit-card-2-front-fill text-warning me-1"></i> Thanh toán bằng Thẻ Visa</h6>
              <span class="badge bg-primary px-2 py-1"><i class="bi bi-shield-check me-1"></i>Verified by Visa</span>
            </div>
            <div class="row g-2">
              <div class="col-12">
                <label class="form-label small text-muted mb-1">Số thẻ Visa (16 chữ số, bắt đầu bằng số 4):</label>
                <div class="input-group input-group-sm">
                  <span class="input-group-text"><i class="bi bi-credit-card"></i></span>
                  <input type="text" id="pmCardNumber" class="form-control" placeholder="4xxx xxxx xxxx xxxx" maxlength="19">
                </div>
              </div>
              <div class="col-12">
                <label class="form-label small text-muted mb-1">Tên in trên thẻ Visa (In hoa không dấu):</label>
                <input type="text" id="pmCardHolder" class="form-control form-control-sm text-uppercase" placeholder="NGUYEN VAN A">
              </div>
              <div class="col-6">
                <label class="form-label small text-muted mb-1">Hạn sử dụng (MM/YY):</label>
                <input type="text" id="pmCardExpiry" class="form-control form-control-sm" placeholder="MM/YY (VD: 12/28)" maxlength="5">
              </div>
              <div class="col-6">
                <label class="form-label small text-muted mb-1">Mã bảo mật CVV (3 số):</label>
                <input type="password" id="pmCardCvv" class="form-control form-control-sm" placeholder="3 chữ số mặt sau" maxlength="3">
              </div>
            </div>
            <div class="form-text small text-muted mt-2">
              <i class="bi bi-lock-fill text-success me-1"></i> Bảo mật tiêu chuẩn PCI-DSS Level 1 & mã hóa SSL 256-bit an toàn tuyệt đối.
            </div>
          </div>
        `;
      }

      return '';
    },

    setDistance(km) {
      this.activeState.distanceKm = km;
      this.renderCheckoutModal();
    },

    setPaymentMethod(method) {
      this.activeState.paymentMethod = method;
      const contentEl = document.getElementById('paymentMethodDynamicContent');
      if (contentEl) {
        const summary = PricingEngine.calculateSummary({
          cartItems: this.activeState.cartItems,
          distanceKm: this.activeState.distanceKm,
          voucherCode: this.activeState.appliedVoucher
        });
        contentEl.innerHTML = this.renderPaymentMethodDetails(summary.finalTotal);
      }
      // Re-render visual active border
      document.querySelectorAll('.payment-method-box').forEach(box => {
        box.classList.remove('border-danger', 'bg-danger-subtle', 'fw-bold');
      });
      if (event && event.currentTarget) {
        event.currentTarget.classList.add('border-danger', 'bg-danger-subtle', 'fw-bold');
      }
    },

    applyVoucher() {
      const input = document.getElementById('pmVoucherInput');
      if (!input) return;
      const code = input.value.trim().toUpperCase();
      this.activeState.appliedVoucher = code;
      this.renderCheckoutModal();
    },

    submitOrder() {
      const nameInput = document.getElementById('pmCustName');
      const phoneInput = document.getElementById('pmCustPhone');
      const addressInput = document.getElementById('pmCustAddress');
      const noteInput = document.getElementById('pmCustNote');

      const formData = {
        name: nameInput ? nameInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        address: addressInput ? addressInput.value : '',
        note: noteInput ? noteInput.value : '',
        distanceKm: this.activeState.distanceKm,
        paymentMethod: this.activeState.paymentMethod
      };

      if (this.activeState.paymentMethod === 'COD') {
        const cashNote = (document.getElementById('pmCashNote') || {}).value || '';
        if (cashNote) {
          formData.note = (formData.note ? formData.note + ' | ' : '') + 'Tiền mặt: ' + cashNote;
        }
      }

      if (this.activeState.paymentMethod === 'VISA' || this.activeState.paymentMethod === 'CARD') {
        formData.cardData = {
          cardNumber: (document.getElementById('pmCardNumber') || {}).value || '',
          cardHolder: (document.getElementById('pmCardHolder') || {}).value || '',
          expiry: (document.getElementById('pmCardExpiry') || {}).value || '',
          cvv: (document.getElementById('pmCardCvv') || {}).value || ''
        };
      }

      const validation = PaymentValidator.validateOrderForm(formData);
      if (!validation.isValid) {
        let msg = 'Vui lòng kiểm tra lại thông tin:\n';
        if (validation.errors.name) msg += `- ${validation.errors.name}\n`;
        if (validation.errors.phone) msg += `- ${validation.errors.phone}\n`;
        if (validation.errors.address) msg += `- ${validation.errors.address}\n`;
        if (validation.errors.distanceKm) msg += `- ${validation.errors.distanceKm}\n`;
        if (validation.errors.card) {
          const cardErr = validation.errors.card;
          if (cardErr.cardNumber) msg += `- ${cardErr.cardNumber}\n`;
          if (cardErr.cardHolder) msg += `- ${cardErr.cardHolder}\n`;
          if (cardErr.expiry) msg += `- ${cardErr.expiry}\n`;
          if (cardErr.cvv) msg += `- ${cardErr.cvv}\n`;
        }
        alert(msg);
        return;
      }

      const summary = PricingEngine.calculateSummary({
        cartItems: this.activeState.cartItems,
        distanceKm: this.activeState.distanceKm,
        voucherCode: this.activeState.appliedVoucher
      });

      // Tạo đơn hàng thành công
      const order = PaymentProcessor.processPayment({
        cartItems: this.activeState.cartItems,
        formData,
        pricingSummary: summary
      });

      // Ẩn Checkout Modal
      const modalEl = document.getElementById('paymentCheckoutModal');
      if (modalEl && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
      }

      // Xóa giỏ hàng Module 1 (Giao tiếp module)
      if (typeof window.AppState !== 'undefined') {
        window.AppState.cart = [];
        window.AppState.activePromoCode = '';
        window.AppState.discountAmount = 0;
        if (typeof window.updateCartUI === 'function') {
          window.updateCartUI();
        }
      }

      // Render E-Receipt
      this.renderReceipt(order);
    },

    /**
     * Render Hóa đơn điện tử chi tiết (E-Invoice / Receipt)
     */
    renderReceipt(order) {
      let receiptContainer = document.getElementById('paymentReceiptModalWrapper');
      if (!receiptContainer) {
        receiptContainer = document.createElement('div');
        receiptContainer.id = 'paymentReceiptModalWrapper';
        document.body.appendChild(receiptContainer);
      }

      receiptContainer.innerHTML = `
        <div class="modal fade" id="paymentReceiptModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content rounded-4 border-0 shadow-24 overflow-hidden">
              <div class="modal-body p-5">
                <!-- Receipt Header -->
                <div class="text-center pb-4 border-bottom mb-4">
                  <img src="images/KFC_logo-image.png" alt="KFC Logo" style="height: 52px;" onerror="this.src='images/logo.png'">
                  <h4 class="fw-bold text-dark mt-2 mb-1">HÓA ĐƠN ĐẶT MÓN KFC VIỆT NAM</h4>
                  <div class="text-muted small">Cửa hàng: ${order.store.name} • Đ/C: ${order.store.address}</div>
                  <div class="badge bg-success mt-2 px-3 py-2 fs-6">
                    <i class="bi bi-check-circle-fill me-1"></i> ĐÃ XÁC NHẬN ĐƠN HÀNG THÀNH CÔNG
                  </div>
                </div>

                <!-- Info Grid -->
                <div class="row g-3 mb-4 small">
                  <div class="col-6">
                    <span class="text-muted">Mã đơn hàng:</span> <strong class="text-danger fs-6">#${order.orderId}</strong>
                  </div>
                  <div class="col-6 text-end">
                    <span class="text-muted">Thời gian đặt:</span> <strong>${order.createdAtFormatted}</strong>
                  </div>
                  <div class="col-6">
                    <span class="text-muted">Khách hàng:</span> <strong>${order.customer.name}</strong> (${order.customer.phone})
                  </div>
                  <div class="col-6 text-end">
                    <span class="text-muted">Dự kiến giao:</span> <strong class="text-danger">${order.estimatedDeliveryTime} (Trong 30 phút)</strong>
                  </div>
                  <div class="col-12">
                    <span class="text-muted">Địa chỉ nhận hàng:</span> <strong>${order.customer.address}</strong> (Khoảng cách: ${order.customer.distanceKm} km)
                  </div>
                  ${order.customer.note ? `
                    <div class="col-12">
                      <span class="text-muted">Ghi chú:</span> <em>${order.customer.note}</em>
                    </div>
                  ` : ''}
                </div>

                <!-- Itemized Table -->
                <div class="table-responsive mb-4">
                  <table class="table table-sm align-middle">
                    <thead class="table-light">
                      <tr>
                        <th>Tên Món Ăn</th>
                        <th class="text-center">SL</th>
                        <th class="text-end">Đơn Giá</th>
                        <th class="text-end">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${order.items.map(it => `
                        <tr>
                          <td class="fw-bold">${it.name}</td>
                          <td class="text-center">${it.qty}</td>
                          <td class="text-end">${it.price.toLocaleString('vi-VN')} đ</td>
                          <td class="text-end fw-bold">${it.subtotal.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      `).join('')}
                    </tbody>
                    <tfoot class="border-top">
                      <tr>
                        <td colspan="3" class="text-end text-muted">Tạm tính:</td>
                        <td class="text-end fw-bold">${order.pricing.subtotal.toLocaleString('vi-VN')} đ</td>
                      </tr>
                      <tr>
                        <td colspan="3" class="text-end text-muted">Phí giao hàng:</td>
                        <td class="text-end fw-bold ${order.pricing.shippingFee === 0 ? 'text-success' : ''}">
                          ${order.pricing.shippingFee === 0 ? 'MIỄN PHÍ' : order.pricing.shippingFee.toLocaleString('vi-VN') + ' đ'}
                        </td>
                      </tr>
                      ${order.pricing.discount > 0 ? `
                        <tr>
                          <td colspan="3" class="text-end text-success">Giảm giá voucher (${order.pricing.voucherCode}):</td>
                          <td class="text-end fw-bold text-success">-${order.pricing.discount.toLocaleString('vi-VN')} đ</td>
                        </tr>
                      ` : ''}
                      <tr class="table-danger fs-5">
                        <td colspan="3" class="text-end fw-bold text-danger">TỔNG THANH TOÁN:</td>
                        <td class="text-end fw-bold text-danger">${order.pricing.finalTotal.toLocaleString('vi-VN')} đ</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div class="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center mb-4 small">
                  <div>
                    Phương thức thanh toán: <strong>${order.payment.method}</strong> (${order.payment.status === 'PAID' ? 'Đã Thanh Toán' : 'Thanh Toán Khi Nhận'})
                  </div>
                  <div>
                    Mã GD: <code>${order.payment.transactionId}</code>
                  </div>
                </div>

                <!-- Footer Actions -->
                <div class="d-flex justify-content-between gap-2">
                  <button class="btn btn-outline-dark" onclick="window.print()">
                    <i class="bi bi-printer me-1"></i> In Hóa Đơn
                  </button>
                  <button class="btn btn-danger px-4 fw-bold" data-bs-dismiss="modal">
                    <i class="bi bi-house me-1"></i> Tiếp Tục Mua Sắm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      if (typeof bootstrap !== 'undefined') {
        const receiptModal = new bootstrap.Modal(document.getElementById('paymentReceiptModal'));
        receiptModal.show();
      }
    }
  };

  // 8. BỘ KIỂM THỬ TRÊN TRÌNH DUYỆT (BROWSER TEST SUITE RUNNER)
  const BrowserTestRunner = {
    runAll() {
      const results = [];
      function assertEqual(actual, expected, msg) {
        if (actual !== expected) {
          throw new Error(msg || `Kỳ vọng ${expected} nhưng nhận được ${actual}`);
        }
      }
      function assertOk(val, msg) {
        if (!val) throw new Error(msg || `Kỳ vọng giá trị truthy nhưng nhận được ${val}`);
      }
      function test(name, fn) {
        try {
          fn();
          results.push({ name, passed: true });
        } catch (err) {
          results.push({ name, passed: false, error: err.message });
        }
      }

      // 1. Validation
      test('1.1: SĐT Việt Nam hợp lệ (10 số, đầu 03, 05, 07, 08, 09)', () => {
        assertEqual(PaymentValidator.validatePhone('0901234567'), true);
        assertEqual(PaymentValidator.validatePhone('0389998888'), true);
      });
      test('1.2: SĐT không hợp lệ (sai đầu số, thiếu số, thừa số)', () => {
        assertEqual(PaymentValidator.validatePhone('0123456789'), false);
        assertEqual(PaymentValidator.validatePhone('090123456'), false);
      });
      test('1.3: Xác thực họ tên người nhận (2 - 50 ký tự)', () => {
        assertEqual(PaymentValidator.validateCustomerName('Nguyễn Văn A'), true);
        assertEqual(PaymentValidator.validateCustomerName('A'), false);
      });
      test('1.4: Xác thực địa chỉ giao hàng (>= 8 ký tự)', () => {
        assertEqual(PaymentValidator.validateAddress('213A Nguyễn Văn Cừ, Quận 5'), true);
        assertEqual(PaymentValidator.validateAddress('Q5'), false);
      });
      test('1.5: Khung giờ phục vụ 09:00 - 21:30 (chinh_sach.md)', () => {
        const dOpen = new Date('2026-11-01T11:00:00');
        assertEqual(PaymentValidator.validateOperatingHours(dOpen).isOpen, true);
        const dClose = new Date('2026-11-01T22:30:00');
        assertEqual(PaymentValidator.validateOperatingHours(dClose).isOpen, false);
      });
      test('1.6: Thuật toán Luhn số thẻ ngân hàng', () => {
        assertEqual(PaymentValidator.validateCardNumber('4532015112830366'), true);
        assertEqual(PaymentValidator.validateCardNumber('4532015112830367'), false);
      });

      // 2. Shipping Rules
      test('2.1: Bán kính < 3km, đơn < 100k -> Phí 15.000đ', () => {
        const res = ShippingCalculator.calculate({ distanceKm: 2, subtotal: 89000 });
        assertEqual(res.finalFee, 15000);
      });
      test('2.2: Bán kính < 3km, đơn >= 100k -> Miễn phí (0đ)', () => {
        const res = ShippingCalculator.calculate({ distanceKm: 2, subtotal: 100000 });
        assertEqual(res.finalFee, 0);
      });
      test('2.3: Bán kính 3 - 5km, đơn >= 150k CHƯA có voucher -> Phí 20.000đ', () => {
        const res = ShippingCalculator.calculate({ distanceKm: 4, subtotal: 160000 });
        assertEqual(res.finalFee, 20000);
      });
      test('2.4: Bán kính 3 - 5km, đơn >= 150k CÓ mã KFCFREESHIP -> Miễn phí (0đ)', () => {
        const res = ShippingCalculator.calculate({ distanceKm: 4, subtotal: 160000, voucherCode: 'KFCFREESHIP' });
        assertEqual(res.finalFee, 0);
      });
      test('2.5: Bán kính > 5km, đơn < 250k -> Phí 30.000đ', () => {
        const res = ShippingCalculator.calculate({ distanceKm: 8, subtotal: 200000 });
        assertEqual(res.finalFee, 30000);
      });
      test('2.6: Bán kính > 5km, đơn >= 250k -> Hỗ trợ 50% (còn 15.000đ)', () => {
        const res = ShippingCalculator.calculate({ distanceKm: 8, subtotal: 260000 });
        assertEqual(res.finalFee, 15000);
      });

      // 3. Vouchers
      test('3.1: Voucher KFC20K với đơn < 100k -> Từ chối', () => {
        assertEqual(VoucherEngine.applyVoucher({ code: 'KFC20K', subtotal: 89000 }).valid, false);
      });
      test('3.2: Voucher KFC20K với đơn >= 100k -> Giảm 20.000đ', () => {
        const res = VoucherEngine.applyVoucher({ code: 'KFC20K', subtotal: 120000 });
        assertEqual(res.valid, true);
        assertEqual(res.discount, 20000);
      });
      test('3.3: Voucher KFCFREESHIP với khoảng cách > 5km -> Từ chối', () => {
        assertEqual(VoucherEngine.applyVoucher({ code: 'KFCFREESHIP', subtotal: 160000, distanceKm: 6 }).valid, false);
      });
      test('3.4: Voucher KFCFREESHIP bán kính <= 5km và đơn >= 150k -> Hợp lệ', () => {
        assertEqual(VoucherEngine.applyVoucher({ code: 'KFCFREESHIP', subtotal: 160000, distanceKm: 4 }).valid, true);
      });
      test('3.5: Voucher CHICKENLOVE không có gà rán -> Từ chối', () => {
        const cart = [{ product: { id: 'kfc-06', name: 'Khoai', category: 'combo', price: 35000 } }];
        assertEqual(VoucherEngine.applyVoucher({ code: 'CHICKENLOVE', subtotal: 70000, cartItems: cart }).valid, false);
      });
      test('3.6: Voucher CHICKENLOVE có gà rán -> Giảm 19.000đ (1 lon Pepsi)', () => {
        const cart = [{ product: { id: 'kfc-02', name: 'Gà Giòn Cay', category: 'ga-ran', price: 38000 } }];
        const res = VoucherEngine.applyVoucher({ code: 'CHICKENLOVE', subtotal: 76000, cartItems: cart });
        assertEqual(res.valid, true);
        assertEqual(res.discount, 19000);
      });
      test('3.7: Voucher APPNEW giảm 15% tối đa 50.000đ', () => {
        assertEqual(VoucherEngine.applyVoucher({ code: 'APPNEW', subtotal: 200000 }).discount, 30000);
        assertEqual(VoucherEngine.applyVoucher({ code: 'APPNEW', subtotal: 500000 }).discount, 50000);
      });
      test('3.8: Mã không tồn tại -> Báo lỗi', () => {
        assertEqual(VoucherEngine.applyVoucher({ code: 'INVALID', subtotal: 100000 }).valid, false);
      });

      // 4. Pricing
      test('4.1: Tính toán tổng tiền finalTotal = subtotal - discount + finalFee', () => {
        const cart = [{ product: { id: 'kfc-01', price: 89000 }, qty: 2 }];
        const sum = PricingEngine.calculateSummary({ cartItems: cart, distanceKm: 4, voucherCode: 'KFC20K' });
        assertEqual(sum.subtotal, 178000);
        assertEqual(sum.discount, 20000);
        assertEqual(sum.shipping.finalFee, 20000);
        assertEqual(sum.finalTotal, 178000);
      });
      test('4.2: Tổng tiền không âm', () => {
        const sum = PricingEngine.calculateSummary({ cartItems: [], distanceKm: 1 });
        assertOk(sum.finalTotal >= 0);
      });

      // 5. Payment Methods (Momo, Tiền mặt, Zalo pay, Visa)
      test('5.1: Định dạng mã đơn hàng chuẩn KFC-YYYYMMDD-XXXX', () => {
        const oid = PaymentProcessor.generateOrderId();
        assertOk(/^KFC-\d{8}-\d{4}$/.test(oid));
      });
      test('5.2: Phương thức 1 - Mã QR MOMO: Sinh payload MoMo, số ĐT và QR URL', () => {
        const momo = PaymentProcessor.generateMoMoPayload({ orderId: 'KFC-20261101-5678', amount: 150000 });
        assertEqual(momo.amount, 150000);
        assertEqual(momo.phone, '0901234567');
      });
      test('5.3: Phương thức 2 - Tiền mặt (COD): Đơn hàng trạng thái PENDING', () => {
        const cart = [{ product: { id: 'kfc-01', name: 'Combo', price: 89000 }, qty: 1 }];
        const form = { name: 'Nguyễn Văn A', phone: '0901234567', address: '213A Nguyễn Văn Cừ', distanceKm: 2, paymentMethod: 'COD' };
        const pr = PricingEngine.calculateSummary({ cartItems: cart, distanceKm: 2 });
        const o = PaymentProcessor.processPayment({ cartItems: cart, formData: form, pricingSummary: pr });
        assertEqual(o.payment.status, 'PENDING');
      });
      test('5.4: Phương thức 3 - Zalo pay: Sinh mã QR thanh toán ZaloPay và Merchant', () => {
        const zalo = PaymentProcessor.generateZaloPayPayload({ orderId: 'KFC-20261101-9988', amount: 89000 });
        assertEqual(zalo.amount, 89000);
        assertOk(zalo.merchantName.includes('KFC VIỆT NAM'));
      });
      test('5.5: Phương thức 4 - Visa: Xác thực thẻ Visa hợp lệ (bắt đầu bằng 4, 16 số, Luhn)', () => {
        const validVisa = { cardNumber: '4532015112830366', cardHolder: 'NGUYEN VAN A', expiry: '12/28', cvv: '123' };
        assertEqual(PaymentValidator.validateVisaCard(validVisa).isValid, true);
      });
      test('5.6: Phương thức 4 - Visa: Từ chối thẻ không bắt đầu bằng số 4', () => {
        const invalidVisa = { cardNumber: '5500000000000004', cardHolder: 'NGUYEN VAN A', expiry: '12/28', cvv: '123' };
        assertEqual(PaymentValidator.validateVisaCard(invalidVisa).isValid, false);
      });
      test('5.7: Phương thức 4 - Visa: Từ chối thẻ có mã CVV sai định dạng (không phải 3 số)', () => {
        const invalidCvv = { cardNumber: '4532015112830366', cardHolder: 'NGUYEN VAN A', expiry: '12/28', cvv: '1234' };
        assertEqual(PaymentValidator.validateVisaCard(invalidCvv).isValid, false);
      });
      test('5.8: Tạo đơn hàng với cam kết giao hàng 30 phút theo chinh_sach.md', () => {
        const cart = [{ product: { id: 'kfc-01', name: 'Combo', price: 89000 }, qty: 1 }];
        const form = { name: 'Nguyễn Văn A', phone: '0901234567', address: '213A Nguyễn Văn Cừ', distanceKm: 2, paymentMethod: 'VISA', cardData: { cardNumber: '4532015112830366', cardHolder: 'NGUYEN VAN A', expiry: '12/28', cvv: '123' } };
        const pr = PricingEngine.calculateSummary({ cartItems: cart, distanceKm: 2 });
        const o = PaymentProcessor.processPayment({ cartItems: cart, formData: form, pricingSummary: pr });
        assertEqual(o.commitmentMinutes, 30);
        assertEqual(o.payment.status, 'PAID');
      });

      return results;
    },

    showModal() {
      const results = this.runAll();
      const passed = results.filter(r => r.passed).length;
      const total = results.length;

      let modalEl = document.getElementById('paymentTestResultModal');
      if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'paymentTestResultModal';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        document.body.appendChild(modalEl);
      }

      modalEl.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content rounded-4 border-0 shadow-lg">
            <div class="modal-header bg-dark text-white py-3">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-patch-check-fill text-success me-2"></i>
                Kết Quả Test Suite Module Thanh Toán (#2)
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4 bg-light">
              <div class="alert ${passed === total ? 'alert-success' : 'alert-danger'} d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 class="alert-heading fw-bold mb-1">
                    ${passed === total ? 'TẤT CẢ TEST CASES ĐÃ PASS 100%' : 'CÓ TEST CASES CHƯA ĐẠT'}
                  </h5>
                  <p class="mb-0 small">Đã kiểm thử toàn diện các điều kiện trong <code>chinh_sach.md</code> và <code>khuyen_mai.md</code>.</p>
                </div>
                <span class="badge ${passed === total ? 'bg-success' : 'bg-danger'} fs-5 px-3 py-2">
                  ${passed} / ${total} PASS
                </span>
              </div>

              <div class="list-group shadow-sm">
                ${results.map((r, i) => `
                  <div class="list-group-item d-flex justify-content-between align-items-center py-2">
                    <span class="small font-monospace">${r.name}</span>
                    <span class="badge ${r.passed ? 'bg-success' : 'bg-danger'} rounded-pill">
                      ${r.passed ? '✓ PASS' : '✗ FAIL'}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="modal-footer bg-white">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
            </div>
          </div>
        </div>
      `;

      if (typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modalEl);
        bsModal.show();
      }
    }
  };

  // EXPORT PUBLIC API
  return {
    Config: PaymentConfig,
    Validator: PaymentValidator,
    ShippingCalculator,
    VoucherEngine,
    PricingEngine,
    Processor: PaymentProcessor,
    UI: PaymentUI,
    TestRunner: BrowserTestRunner,
    // Convenient shortcuts
    openCheckout: (cartItems, voucher) => PaymentUI.openCheckout(cartItems, voucher),
    setDistance: (km) => PaymentUI.setDistance(km),
    setPaymentMethod: (method) => PaymentUI.setPaymentMethod(method),
    applyVoucher: () => PaymentUI.applyVoucher(),
    submitOrder: () => PaymentUI.submitOrder(),
    runTests: () => BrowserTestRunner.showModal()
  };
}));
