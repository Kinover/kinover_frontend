// 가족
export const initialFamilyState = {
  familyId: 1,
  name: '',
  notice: '',
  createdAt: '',
  updatedAt: '',
  relationship: "",
  loading: false,
  error: null,
};

// 유저
export const initialUserState = {
  userId: null,
  birth: null,
  phoneNumber: null,
  image: null,
  name: null,
  email: null,
  status: null,
  updatedAt: null,
  login: false,
  loading: false,
  error: null,
};

export const initialChatRoomState = {
  chatRoomList: [],
  loading: false,
  error: null,
};

// 유저채팅방
export const initialUserChatRoomState = {
  userChatRoomId: '',
  joinedAt: '',
  chatRoomId: '',
  userId: '',
  loading: false,
  error: null,
};

// 추억
export const initialMemoryState = {
  memoryList: [],
  memoryId: '',
  date: '',
  familyId: 1,
  image: '',
  createdAt: '',
  loading: false,
  error: null,
};

// 일정
export const initialScheduleState = {
  scheduleId: '',
  scheduleList: [],
  title: '',
  memo: '',
  isPersonal: '',
  date: '',
  loading: false,
  error: null,
};

export const initialUserFamilyState = {
  userFamily: [],
  loading: false,
  error: null,
  familyUserList: [],
};

export const initialMessageState = {
  messageList: [],
  sendMessage: {},
  loading: false,
  error: null,
};

export const initialRecChallengeState = {
  recChallengeList: [],
  loading: false,
  error: null,
};

export default initialUserState;
