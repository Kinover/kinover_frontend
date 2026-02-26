// src/features/chat/utils/chatRoomTitleHelper.js

// familyUserList에서 userId로 유저 찾기
function findFamilyUserById(familyUserList, userId) {
    if (!Array.isArray(familyUserList)) return null;
    return familyUserList.find(user => user.userId === userId) || null;
  }
  
 // familyUser 하나에서 이름 뽑기 (실제 필드명에 맞게 조정)
  function extractFamilyUserName(familyUser) {
    if (!familyUser) return null;
  
 // 실제 필드 구조에 맞춰서 필요한 것만 남겨도 됨
    return (
      familyUser.nickname ||   // 예: nickname
      familyUser.name ||       // 예: name
      familyUser.userName ||   // 예: userName
      null
    );
  }
  
 // roomName이 Initial일 때: 본인 제외 참여자 이름 배열 생성
  function getParticipantNamesFromFamily(userChatRooms, myUserId, familyUserList) {
    if (!Array.isArray(userChatRooms) || !Array.isArray(familyUserList)) return [];
  
    return userChatRooms
      .filter(uc => uc && uc.userId !== myUserId) // 본인 제외
      .map(uc => {
        const familyUser = findFamilyUserById(familyUserList, uc.userId);
        return extractFamilyUserName(familyUser);
      })
      .filter(Boolean); // null/undefined 제거
  }
  
 // 최종 채팅방 제목 생성 (외부에선 이 함수만 import 해서 사용)
  export function getChatRoomTitle(
    roomName,
    kino,
    userChatRooms,
    myUserId,
    familyUserList,
  ) {
 // 1) 키노 방이면 고정
    if (kino) return '키노상담소';
  
 // 2) Initial 방이면 → 가족 유저 리스트에서 이름 찾아서 제목 생성
    if (roomName === 'Initial') {
      const names = getParticipantNamesFromFamily(
        userChatRooms,
        myUserId,
        familyUserList,
      );
  
      if (names.length > 0) {
 // 예: "지윤, 엄마, 아빠"
        return names.join(', ');
      }
    }
  
    return roomName || '이름 없는 채팅방';
  }
  