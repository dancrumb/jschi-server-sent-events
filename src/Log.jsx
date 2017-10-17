import React from 'react';
import LogEntry from './LogEntry'

const Log = ({events}) => {
  return (
    <div className="Log">
      {events.map((event,index) => <LogEntry key={index} event={event}></LogEntry>)}
    </div>
  );
}

export default Log;
