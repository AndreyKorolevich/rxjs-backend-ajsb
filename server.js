const http = require('http');
const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const { v4: uuidv4 } = require('uuid');
const faker = require('faker');
const moment = require('moment')
const app = new Koa();

const public = path.join(__dirname, '/public')
app.use(koaStatic(public));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }
    ctx.response.status = 204;
  }
});

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

const Router = require('koa-router');
const router = new Router();

router.get('/messages/unread', async (ctx, next) => {
  ctx.response.body = {
    email: faker.internet.exampleEmail(),
    message: faker.lorem.sentence(),
    date: [moment().format('LT'), moment().format('L')]
  }
});

router.get('/posts/latest', async (ctx, next) => {

  const posts = [];
  for (let i = 0; i < 5; i++) {
    posts.push({
      post_id: uuidv4(),
      author: faker.name.findName(),
      avatar: faker.image.avatar(),
      content: faker.image.nature(),
      created: [moment().format('LT'), moment().format('L')]
    })
  }

  ctx.response.body = {
    posts
  }
});

router.get('/posts/comments/latest', async (ctx, next) => {
  const { post_id } = ctx.request.query;
  const comments = [];

  for (let i = 0; i < 3; i++) {
    comments.push({
      author: faker.name.findName(),
      avatar: faker.image.avatar(),
      message: faker.lorem.sentence(),
      date: [moment().format('LT'), moment().format('L')]
    })

  }
  ctx.response.body = {
    post_id,
    comments,
  }
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback()).listen(port);