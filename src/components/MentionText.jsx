import React, {useMemo} from 'react';
import {Text} from 'react-native';

export default function MentionText({text, users = [], textStyle, mentionStyle}) {
  const nameMap = useMemo(() => {
    const m = new Map();
    (users || []).forEach(u => {
      if (u?.name) m.set(String(u.name), u);
    });
    return m;
  }, [users]);

  const parts = useMemo(() => {
    if (!text) return [''];
    return String(text).split(/(@[^\s@]{1,20})/g);
  }, [text]);

  return (
    <Text style={textStyle}>
      {parts.map((p, idx) => {
        if (p?.startsWith('@')) {
          const name = p.slice(1);
          const user = nameMap.get(name);
          if (user) {
            return (
              <Text key={`${idx}_${p}`} style={mentionStyle}>
                {p}
              </Text>
            );
          }
        }
        return <Text key={`${idx}_${p}`}>{p}</Text>;
      })}
    </Text>
  );
}
