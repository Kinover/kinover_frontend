import React, {useMemo} from 'react';
import AppText from 'components/AppText';

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
    <AppText allowFontScaling={false} style={textStyle}>
      {parts.map((p, idx) => {
        if (p?.startsWith('@')) {
          const name = p.slice(1);
          const user = nameMap.get(name);
          if (user) {
            return (
              <AppText allowFontScaling={false} key={`${idx}_${p}`} style={mentionStyle}>
                {p}
              </AppText>
            );
          }
        }
        return <AppText allowFontScaling={false} key={`${idx}_${p}`}>{p}</AppText>;
      })}
    </AppText>
  );
}
