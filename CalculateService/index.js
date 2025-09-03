/**
 * Calculator Service - Service tính toán toán học
 * Hỗ trợ: cộng, trừ, nhân, chia, làm tròn decimal, big integer
 */

class CalculatorService {
    constructor() {
        // Độ chính xác mặc định cho decimal
        this.defaultPrecision = 2;
    }

    /**
     * Phép cộng
     * @param {number|string|BigInt} a - Số thứ nhất
     * @param {number|string|BigInt} b - Số thứ hai
     * @param {boolean} useBigInt - Sử dụng BigInt cho số lớn
     * @returns {number|BigInt} Kết quả phép cộng
     */
    #addNumber(a, b, useBigInt = false) {
        try {
            if (useBigInt) {
                return this.#addNumberBigInteger(a, b);
            }

            const result = Number(a) + Number(b);
            return Number(result.toFixed(this.defaultPrecision));
        } catch (error) {
            throw new Error(`Lỗi phép cộng: ${error.message}`);
        }
    }

    /**
     * Cộng hai số nguyên lớn dạng chuỗi
     * @param {string} a - Chuỗi số thứ nhất
     * @param {string} b - Chuỗi số thứ hai
     * @returns {string} Kết quả phép cộng dưới dạng chuỗi
     */
    #addNumberBigInteger(a, b) {
        let num1 = a.replace(/^0+/, '');
        let num2 = b.replace(/^0+/, '');
        if (num1.length < num2.length) [num1, num2] = [num2, num1];
        num1 = num1.split('').reverse();
        num2 = num2.split('').reverse();
        const result = [];
        let carry = 0;
        for (let i = 0; i < num1.length; i++) {
            const digit1 = parseInt(num1[i], 10);
            const digit2 = i < num2.length ? parseInt(num2[i], 10) : 0;
            const sum = digit1 + digit2 + carry;
            result.push(sum % 10);
            carry = Math.floor(sum / 10);
        }
        if (carry) result.push(carry);
        return result.reverse().join('');
    }

    /**
     * Phép trừ
     * @param {number|string|BigInt} a - Số bị trừ
     * @param {number|string|BigInt} b - Số trừ
     * @param {boolean} useBigInt - Sử dụng BigInt cho số lớn
     * @returns {number|BigInt} Kết quả phép trừ
     */
    #subtractNumber(a, b, useBigInt = false) {
        try {
            if (useBigInt) {
                return this.#subtractNumberBigInteger(a, b);
            }
            return Number(a) - Number(b);
        } catch (error) {
            throw new Error(`Lỗi phép trừ: ${error.message}`);
        }
    }

    /**
     * Trừ hai số nguyên lớn dạng chuỗi
     * @param {string} a - Chuỗi số bị trừ
     * @param {string} b - Chuỗi số trừ
     * @returns {string} Kết quả phép trừ dưới dạng chuỗi
     */
    #subtractNumberBigInteger(a, b) {
        let num1 = a.replace(/^0+/, '');
        let num2 = b.replace(/^0+/, '');
        // Kiểm tra nếu a < b thì trả về số âm
        let negative = false;
        if (num1.length < num2.length || (num1.length === num2.length && num1 < num2)) {
            [num1, num2] = [num2, num1];
            negative = true;
        }
        num1 = num1.split('').reverse();
        num2 = num2.split('').reverse();
        const result = [];
        let borrow = 0;
        for (let i = 0; i < num1.length; i++) {
            let digit1 = parseInt(num1[i], 10) - borrow;
            const digit2 = i < num2.length ? parseInt(num2[i], 10) : 0;
            if (digit1 < digit2) {
                digit1 += 10;
                borrow = 1;
            } else {
                borrow = 0;
            }
            result.push(digit1 - digit2);
        }
        // Loại bỏ số 0 ở đầu
        while (result.length > 1 && result[result.length - 1] === 0) {
            result.pop();
        }
        let resStr = result.reverse().join('');
        return negative ? '-' + resStr : resStr;
    }

    /**
     * Nhân hai số nguyên lớn dạng chuỗi
     * @param {string} a - Chuỗi số thứ nhất
     * @param {string} b - Chuỗi số thứ hai
     * @returns {string} Kết quả phép nhân dưới dạng chuỗi
     */
    #multiplyNumberBigInteger(a, b) {
        let num1 = a.replace(/^0+/, '');
        let num2 = b.replace(/^0+/, '');
        if (num1 === '0' || num2 === '0') return '0';
        const res = Array(num1.length + num2.length).fill(0);
        for (let i = num1.length - 1; i >= 0; i--) {
            for (let j = num2.length - 1; j >= 0; j--) {
                const mul = parseInt(num1[i], 10) * parseInt(num2[j], 10);
                const sum = mul + res[i + j + 1];
                res[i + j + 1] = sum % 10;
                res[i + j] += Math.floor(sum / 10);
            }
        }
        // Loại bỏ số 0 ở đầu
        while (res[0] === 0) res.shift();
        return res.join('');
    }

    /**
     * Chia hai số nguyên lớn dạng chuỗi (chia lấy phần nguyên)
     * @param {string} a - Chuỗi số bị chia
     * @param {string} b - Chuỗi số chia
     * @returns {string} Kết quả phép chia dưới dạng chuỗi
     */
    #divideNumberBigInteger(a, b) {
        let num1 = a.replace(/^0+/, '');
        let num2 = b.replace(/^0+/, '');
        if (num2 === '0') throw new Error('Không thể chia cho 0');
        if (num1 === '0') return '0';
        if (num2.length > num1.length || (num2.length === num1.length && num2 > num1)) return '0';
        let result = '';
        let temp = '';
        for (let i = 0; i < num1.length; i++) {
            temp += num1[i];
            temp = temp.replace(/^0+/, '');
            let count = 0;
            while (this.#compareBigIntStr(temp, num2) >= 0) {
                temp = this.#subtractNumberBigInteger(temp, num2);
                temp = temp.replace(/^0+/, '');
                count++;
            }
            result += count;
        }
        // Loại bỏ số 0 ở đầu
        result = result.replace(/^0+/, '');
        return result === '' ? '0' : result;
    }

    /**
     * So sánh hai chuỗi số nguyên lớn
     * @param {string} a
     * @param {string} b
     * @returns {number} 1 nếu a > b, 0 nếu a == b, -1 nếu a < b
     */
    #compareBigIntStr(a, b) {
        a = a.replace(/^0+/, '');
        b = b.replace(/^0+/, '');
        if (a.length > b.length) return 1;
        if (a.length < b.length) return -1;
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    }

    /**
     * Phép nhân
     * @param {number|string|BigInt} a - Số thứ nhất
     * @param {number|string|BigInt} b - Số thứ hai
     * @param {boolean} useBigInt - Sử dụng BigInt cho số lớn
     * @returns {number|BigInt} Kết quả phép nhân
     */
    #multiplyNumber(a, b, useBigInt = false) {
        try {
            if (useBigInt) {
                return this.#multiplyNumberBigInteger(a, b);
            }
            return Number((Number(a) * Number(b)).toFixed(this.defaultPrecision));
        } catch (error) {
            throw new Error(`Lỗi phép nhân: ${error.message}`);
        }
    }

    /**
     * Phép chia
     * @param {number|string|BigInt} a - Số bị chia
     * @param {number|string|BigInt} b - Số chia
     * @param {boolean} useBigInt - Sử dụng BigInt cho số lớn
     * @returns {number|BigInt} Kết quả phép chia
     */
    #divideNumber(a, b, useBigInt = false) {
        try {
            if (Number(b) === 0) {
                throw new Error('Không thể chia cho 0');
            }

            if (useBigInt) {
                return this.#divideNumberBigInteger(a, b);
            }
            return +(Number(a) / Number(b)).toFixed(this.defaultPrecision);
        } catch (error) {
            throw new Error(`Lỗi phép chia: ${error.message}`);
        }
    }

    /**
     * Tính lũy thừa
     * @param {number|BigInt} base - Cơ số
     * @param {number|BigInt} exponent - Số mũ
     * @param {boolean} useBigInt - Sử dụng BigInt
     * @returns {number|BigInt} Kết quả lũy thừa
     */
    #powerNumber(base, exponent, useBigInt = false) {
        try {
            if (useBigInt) {
                return BigInt(base) ** BigInt(exponent);
            }
            return +(Math.pow(Number(base), Number(exponent))).toFixed(this.defaultPrecision);
        } catch (error) {
            throw new Error(`Lỗi tính lũy thừa: ${error.message}`);
        }
    }

    /**
     * Kiểm tra xem một giá trị có phải là big integer không
     * @param {any} value - Giá trị cần kiểm tra
     * @returns {boolean} True nếu là big integer
     */
    #isBigInteger(value) {
        // Kiểm tra nếu đã là BigInt
        if (typeof value === 'bigint') {
            return true;
        }

        // Chuyển đổi thành string để kiểm tra
        const str = String(value);

        // Kiểm tra nếu là số nguyên hợp lệ
        if (!/^-?\d+$/.test(str)) {
            return false;
        }

        // Kiểm tra xem số có vượt quá giới hạn Number.MAX_SAFE_INTEGER không
        try {
            const num = Number(str);
            if (!Number.isInteger(num)) {
                return false;
            }

            // Nếu số lớn hơn MAX_SAFE_INTEGER hoặc nhỏ hơn MIN_SAFE_INTEGER
            if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
                return true;
            }

            // Kiểm tra độ dài chuỗi (nếu > 15 chữ số thì có thể cần BigInt)
            const numStr = str.replace('-', '');
            if (numStr.length > 15) {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Tự động detect và quyết định có nên sử dụng BigInt cho hai số
     * @param {any} a - Số thứ nhất
     * @param {any} b - Số thứ hai
     * @returns {boolean} True nếu nên sử dụng BigInt
     */
    #shouldUseBigInt(a, b) {
        return this.#isBigInteger(a) || this.#isBigInteger(b);
    }

    /**
     * Phép cộng với auto-detect BigInt
     * @param {number|string|BigInt} a - Số thứ nhất
     * @param {number|string|BigInt} b - Số thứ hai
     * @returns {number|BigInt} Kết quả phép cộng
     */
    add(a, b) {
        const useBigInt = this.#shouldUseBigInt(a, b);
        return this.#addNumber(a, b, useBigInt);
    }

    /**
     * Phép trừ với auto-detect BigInt
     * @param {number|string|BigInt} a - Số bị trừ
     * @param {number|string|BigInt} b - Số trừ
     * @returns {number|BigInt} Kết quả phép trừ
     */
    subtract(a, b) {
        const useBigInt = this.#shouldUseBigInt(a, b);
        return this.#subtractNumber(a, b, useBigInt);
    }

    /**
     * Phép nhân với auto-detect BigInt
     * @param {number|string|BigInt} a - Số thứ nhất
     * @param {number|string|BigInt} b - Số thứ hai
     * @returns {number|BigInt} Kết quả phép nhân
     */
    multiply(a, b) {
        const useBigInt = this.#shouldUseBigInt(a, b);
        return this.#multiplyNumber(a, b, useBigInt);
    }

    /**
     * Phép chia với auto-detect BigInt
     * @param {number|string|BigInt} a - Số bị chia
     * @param {number|string|BigInt} b - Số chia
     * @returns {number|BigInt} Kết quả phép chia
     */
    divide(a, b) {
        const useBigInt = this.#shouldUseBigInt(a, b);
        return this.#divideNumber(a, b, useBigInt);
    }

    /**
     * Tính lũy thừa với auto-detect BigInt
     * @param {number|BigInt} base - Cơ số
     * @param {number|BigInt} exponent - Số mũ
     * @returns {number|BigInt} Kết quả lũy thừa
     */
    power(base, exponent) {
        const useBigInt = this.#shouldUseBigInt(base, exponent);
        return this.#powerNumber(base, exponent, useBigInt);
    }
}

// Tạo instance mặc định
const calculator = new CalculatorService();