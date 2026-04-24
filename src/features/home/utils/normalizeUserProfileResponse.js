/**
 * GET /user/userinfo · 가족 구성원 목록 등에서 생년월일 필드명이 달라도
 * Redux·UI에서 쓰는 `birth`(YYYY-MM-DD 권장)로 맞춥니다.
 */

function pickBirthRaw(obj) {
  if (!obj || typeof obj !== 'object') {
    return null;
  }
  const v =
    obj.birth ??
    obj.birthday ??
    obj.birthDay ??
    obj.birthDate ??
    obj.dateOfBirth ??
    obj.birth_day;
  if (v == null || v === '') {
    return null;
  }
  return String(v).trim();
}

/**
 * ISO·타임존 포함 문자열 → YYYY-MM-DD (표시·저장 공통)
 */
export function coerceBirthToYmd(raw) {
  if (raw == null || raw === '') {
    return null;
  }
  const s = String(raw).trim();
  if (!s) {
    return null;
  }
  const head = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (head) {
    return head[1];
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  const y = d.getFullYear();
  const mo = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

/** 바텀시트 DatePicker 초기값용 */
export function parseBirthYmdToLocalDate(str) {
  if (str == null || str === '') {
    return null;
  }
  const ymd = coerceBirthToYmd(str);
  if (!ymd) {
    return null;
  }
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function normalizeBirthOnUserDto(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  const raw = pickBirthRaw(obj);
  if (!raw) {
    return obj;
  }
  const birth = coerceBirthToYmd(raw);
  if (!birth) {
    return obj;
  }
  if (obj.birth === birth) {
    return obj;
  }
  return {...obj, birth};
}

function unwrapUserinfoPayload(response) {
  if (response == null) {
    return response;
  }
  if (typeof response !== 'object') {
    return response;
  }
  if (Array.isArray(response)) {
    return response[0] ?? null;
  }
  if (
    response.data != null &&
    typeof response.data === 'object' &&
    !Array.isArray(response.data)
  ) {
    return response.data;
  }
  if (response.user != null && typeof response.user === 'object') {
    return response.user;
  }
  return response;
}

export function normalizeUserinfoResponse(response) {
  const row = unwrapUserinfoPayload(response);
  return normalizeBirthOnUserDto(row);
}

function unwrapFamilyUsersList(response) {
  if (response == null) {
    return [];
  }
  if (Array.isArray(response)) {
    return response;
  }
  if (typeof response !== 'object') {
    return [];
  }
  const list =
    response.data ??
    response.users ??
    response.familyUsers ??
    response.memberList ??
    response.members ??
    response.userList ??
    response.userFamilyList;
  return Array.isArray(list) ? list : [];
}

export function normalizeFamilyUsersResponse(response) {
  return unwrapFamilyUsersList(response).map(normalizeBirthOnUserDto);
}
