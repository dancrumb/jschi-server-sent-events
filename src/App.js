import React, { Component } from 'react';
import './App.css';
import Log from './Log';

require('event-source-polyfill');

class App extends Component {
  constructor() {
    super();
    this.state = {
      events: []
    };
  }

  componentDidMount () {
    /*
     * Connect to the source of events
     */
    this.eventSource = new EventSource('//localhost:7000/events');

    /*
     * Create a listener for specific event types
     */
    this.eventSource.addEventListener('spooky', e => {
      const {data} = e;
      const eventInfo = JSON.parse(data);
      this.setState({events: [...this.state.events, eventInfo]})
    });

    /*
     * Handle lifecycle events
     */
    this.eventSource.onopen = (e) => {
      this.setState({events: [...this.state.events, {event: 'CONNECTED', type: 'system'}]});
    };
    this.eventSource.onerror = (e) => {
      this.setState({events: [...this.state.events, {event: 'NO CONNECTION', type: 'error'}]});
    };
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Haunted House Log</h1>
        </header>
        <Log events={this.state.events}/>
      </div>
    );
  }
}

export default App;
