const Koa = require('koa');
const json = require('koa-json');
const router = require('koa-router')();

const SSEConnection = require('./SSEConnection');

const events = [
  'Door creaked',
  'Room got cold',
  'Heard a strange voice',
  'Ornament moved',
  'Chains rattled',
  'Saw an apparition',
  'Cat ran away',
  'Felt uneasy',
  'Creepy child showed up',
  'Weird writing on wall'
];

const getRandomEvent = () => ({event: events[Math.floor(Math.random() * events.length)]});

const app = new Koa();
app.use(SSEConnection.middleware({debug: true}));
app.use(json());

router.get('/events', (ctx, next) => {
  let count = 0;

  const connection = new SSEConnection({ctx});

  let connectionIsDead = false;
  const makeEvent = () => {
    if(!connectionIsDead) {
      connection.sendEvent({ event: 'spooky', id: count++, data: getRandomEvent()});
      setTimeout(makeEvent, Math.random()*5000);
    }
  };
  connection.on('destroyed', () => {
    connectionIsDead = true;
  });
  makeEvent();

  return next();
});

app.use(router.routes());


app.listen(7000);
