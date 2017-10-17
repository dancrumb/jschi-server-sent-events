const PassThrough = require('stream').PassThrough;
const EventEmitter = require('events');
const winston = require('winston');

class SSEConnection extends EventEmitter {
  static middleware({debug}) {
    SSEConnection.debug = debug;

    return async function sseConnectionMiddleware(ctx, next) {
      if (!ctx.state.sseConnections) {
        ctx.state.sseConnections = [];
      }

      await next();
    };
  }

  constructor({ctx, timeout = 5000}) {
    super();
    this.ctx = ctx;
    this.timeout = timeout;
    this.stream = new PassThrough();
    this.id = 0;
    this.destroyed = false;
    this.paddingSent = false;

    winston.level = SSEConnection.debug ? 'debug' : 'warn';

    /*
     * Make sure the server doesn't time out due to keeping the connection
     * open for too long
     */
    ctx.req.setTimeout(Number.MAX_VALUE);

    /*
     * Set up detection for the closure of the connection (at either end)
     */
    const socket = ctx.socket;
    socket.on('close', () => this.destroy('close'));
    socket.on('finish', () => this.destroy('finish'));
    socket.on('error', () => this.destroy('error'));

    this.stream.on('error', e => winston.error('Stream error, %o', e));

    /*
     * Set up the response headers appropriately
     */
    ctx.status = 200;
    ctx.type = 'text/event-stream;charset=utf-8';
    ctx.set('Cache-Control', 'no-cache');
    ctx.set('Connection', 'keep-alive');
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('X-Accel-Buffering', 'no');

    /*
     * Set the body as a Stream (rather than an object or a string
     */
    this.ctx.body = this.stream;

    /*
     * Send padding to make IE happy
     */
    this.sendPadding();

    /*
     * Set up the heartbeat to _keep_ IE happy
     */
    this.heartbeatID = setInterval(() => {
      this.stream.write(`:heartbeat\n\n`);
    }, this.timeout / 2);
  }

  sendPadding() {
    const padding = new Array(2049);
    this.stream.write(`:${padding.join(' ')}\nretry: ${this.timeout}\n`);
    this.paddingSent = true;
  }

  sendEvent({event, data}) {
    const dataJSON = JSON.stringify(data);
    winston.debug(`sendEvent: ${event} ${dataJSON}`);

    if (this.destroyed) {
      throw new Error(`Tried to send an event on a destroyed SSEConnection: ${event}`);
    }
    if (!this.paddingSent) {
      this.sendPadding();
    }

    this.stream.write(`id:${this.id}\n`);
    this.stream.write(`event:${event}\n`);
    this.stream.write(`data:${dataJSON}\n\n`);

    this.id += 1;
  }

  destroy(reason) {
    if(this.destroyed) {
      return;
    }
    winston.info(`Destroying SSE: ${reason}`);
    this.ctx.res.end();
    clearInterval(this.heartbeatID);
    this.emit('destroyed', {reason});
    this.destroyed = true;
  }
}

SSEConnection.debug = false;

module.exports = SSEConnection;
