// Message timestamps are shown on tap only, always in Bangladesh time
// (Asia/Dhaka) so app and web display the same value regardless of the
// viewer's device timezone.
export function formatMessageTime(m) {
  const d = m?.createdAt ? new Date(m.createdAt) : null;
  if (!d || isNaN(d.getTime())) return m?.time === 'now' ? 'Just now' : '';
  try {
    return d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}

// Exact "last online" text for the chat header, instead of a vague
// "Active recently": minutes/hours/days ago, or the exact Bangladesh
// date-time for anything older than a week.
export function formatLastSeen(lastSeen) {
  const d = lastSeen ? new Date(lastSeen) : null;
  if (!d || isNaN(d.getTime())) return 'Active recently';
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return 'Active just now';
  if (diffMin < 60) return `Active ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Active ${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Active ${diffD}d ago`;
  try {
    return 'Last seen ' + d.toLocaleString('en-US', {
      timeZone: 'Asia/Dhaka',
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch {
    return 'Last seen ' + d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });
  }
}
