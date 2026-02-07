// ✅ 사용 예시 (댓글 전송 payload에 mentionUserIds 포함)
// 예: MemoryDetailBottomSheet에서 입력 영역 대체
import React, {useMemo, useState} from 'react';
import {View} from 'react-native';
import MentionInput from './MentionInput';

export function CommentComposer({user,familyUsers, onSend}) {
  const [text, setText] = useState('');
  const users = useMemo(() => familyUsers || [], [familyUsers]);


  return (
    <View>
      <MentionInput
        value={text}
        onChangeText={setText}
        users={users}
        myUserId={user.userId}
        placeholder="@가족이름 으로 멘션 가능"
        onSubmit={({text: sendText, mentionUserIds}) => {
          onSend({content: sendText, mentionUserIds});
          setText('');
        }}
      />
    </View>
  );
}
