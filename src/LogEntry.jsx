import React from 'react';

const getColor = type => ({
    system: 'blue',
    error: 'red'
  }[type] || 'black');

const LogEntry = ({event}) => {
  return (
    <div className="LogEntry" style={{color: getColor(event.type)}}>
      {event.event}
    </div>
  );
}

export default LogEntry;
