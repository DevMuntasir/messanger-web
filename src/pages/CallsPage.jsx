// CallsPage — web port of the app's CallsScreen (recent calls log,
// same demo call log as the app's mock data).
import React from 'react';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import './CallsPage.css';

const MISSED = '#ff5d73';

// Same demo entries as the app's CALL_LOG mock.
const CALL_LOG = [
  { p: { id: 'maya', name: 'Maya Trinh', initials: 'MT', g: 'A', online: true }, dir: 'in', kind: 'video', time: '9:20 AM', missed: false },
  { p: { id: 'ivan', name: 'Ivan Petrov', initials: 'IP', g: 'B', online: false }, dir: 'in', kind: 'voice', time: 'Yesterday', missed: true },
  { p: { id: 'theo', name: 'Theo Okafor', initials: 'TO', g: 'C', online: true }, dir: 'out', kind: 'voice', time: 'Yesterday', missed: false },
  { p: { id: 'ami', name: 'Ami Sato', initials: 'AS', g: 'D', online: false }, dir: 'out', kind: 'video', time: 'Tue', missed: false },
  { p: { id: 'noor', name: 'Noor Haddad', initials: 'NH', g: 'E', online: true }, dir: 'in', kind: 'voice', time: 'Mon', missed: true },
  { p: { id: 'jade', name: 'Jade Nguyen', initials: 'JN', g: 'F', online: false }, dir: 'out', kind: 'voice', time: 'Sun', missed: false },
];

export default function CallsPage() {
  return (
    <div className="calls-page">
      <div className="calls-header">
        <h1>Calls</h1>
      </div>
      <div className="calls-list">
        {CALL_LOG.map((c, i) => (
          <div key={i} className="call-row">
            <Avatar person={c.p} size={50} online={c.p.online} />
            <div className="call-body">
              <span className="call-name" style={c.missed ? { color: MISSED } : undefined}>
                {c.p.name}
              </span>
              <span className="call-sub" style={c.missed ? { color: MISSED } : undefined}>
                {c.dir === 'out' ? '↗' : '↙'}{' '}
                {c.kind === 'video' ? 'Video · ' : ''}
                {c.missed ? 'Missed' : (c.dir === 'in' ? 'Incoming' : 'Outgoing')} · {c.time}
              </span>
            </div>
            <span className="call-action">
              <Icon name={c.kind === 'video' ? 'video' : 'phone'} size={22} gradient />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
