/**
 * 공통 입력 검증 유틸
 * 로그인, 일정 생성, 가족/채팅방 이름 등 텍스트 입력 검증에 사용합니다.
 */

/** 이메일 형식 정규식 (일반적인 형식) */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * 이메일 형식 검사
 * @param {string} value
 * @returns {boolean}
 */
export function isEmail(value) {
  if (value == null || typeof value !== 'string') return false;
  return EMAIL_REGEX.test(value.trim());
}

/**
 * 최소 글자 수 검사 (trim 후 기준)
 * @param {string} value
 * @param {number} min
 * @returns {{ valid: boolean, message?: string }}
 */
export function minLength(value, min) {
  const str = value != null ? String(value).trim() : '';
  if (min <= 0) return {valid: true};
  if (str.length < min) {
    return {valid: false, message: `최소 ${min}자 이상 입력해주세요.`};
  }
  return {valid: true};
}

/**
 * 최대 글자 수 검사 (trim 후 기준)
 * @param {string} value
 * @param {number} max
 * @returns {{ valid: boolean, message?: string }}
 */
export function maxLength(value, max) {
  const str = value != null ? String(value).trim() : '';
  if (max <= 0) return {valid: true};
  if (str.length > max) {
    return {valid: false, message: `최대 ${max}자까지 입력할 수 있어요.`};
  }
  return {valid: true};
}

/**
 * 최소/최대 글자 수 동시 검사
 * @param {string} value
 * @param {{ min?: number, max?: number }} options
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateLength(value, options = {}) {
  const {min, max} = options;
  if (min != null) {
    const r = minLength(value, min);
    if (!r.valid) return r;
  }
  if (max != null) {
    const r = maxLength(value, max);
    if (!r.valid) return r;
  }
  return {valid: true};
}

/**
 * 필수 입력 검사 (비어 있거나 공백만 있으면 실패)
 * @param {string} value
 * @param {string} [fieldName='값']
 * @returns {{ valid: boolean, message?: string }}
 */
export function required(value, fieldName = '값') {
  const str = value != null ? String(value).trim() : '';
  if (str.length === 0) {
    return {valid: false, message: `${fieldName}을(를) 입력해주세요.`};
  }
  return {valid: true};
}

/**
 * 이메일 + 필수 검사
 * @param {string} value
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateEmail(value) {
  const r = required(value, '이메일');
  if (!r.valid) return r;
  if (!isEmail(value)) {
    return {valid: false, message: '올바른 이메일 형식이에요.'};
  }
  return {valid: true};
}

/**
 * 여러 검사 순서대로 실행, 첫 실패 시 반환
 * @param {string} value
 * @param {Array<() => { valid: boolean, message?: string }>} validators
 * @returns {{ valid: boolean, message?: string }}
 */
export function runValidators(value, validators) {
  for (const fn of validators) {
    const result = fn(value);
    if (result && !result.valid) return result;
  }
  return {valid: true};
}
