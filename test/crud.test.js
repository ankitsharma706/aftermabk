'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const jwt = require('jsonwebtoken');

const config = require('../config/config');
const authMiddleware = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');
const doctorController = require('../controllers/doctor.controller');
const dailyLogController = require('../controllers/dailyLog.controller');
const lactationController = require('../controllers/lactation.controller');
const periodController = require('../controllers/period.controller');
const sessionController = require('../controllers/session.controller');
const communityController = require('../controllers/community.controller');
const questionController = require('../controllers/question.controller');
const {
  User,
  Doctor,
  DailyLog,
  LactationLog,
  PeriodLog,
  Session,
  Community,
  Question,
  Medicine,
  Ngo,
  InsurancePlan,
} = require('../models');

const query = (value) => {
  const result = {
    select: () => result,
    sort: () => result,
    skip: () => result,
    limit: () => result,
    populate: () => result,
    lean: () => Promise.resolve(value),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
  };
  return result;
};

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  send(body) {
    this.body = body;
    return this;
  },
});

const invoke = async (handler, request = {}) => {
  const res = response();
  let error;
  await handler({ body: {}, params: {}, query: {}, ...request }, res, (nextError) => {
    error = nextError;
  });
  if (error) throw error;
  return res;
};

const asDocument = (value) => ({ ...value, toObject: () => ({ ...value }) });

test('registered CRUD routes match the implemented API surface', () => {
  const routeGroups = {
    auth: require('../routes/auth.routes'),
    users: require('../routes/user.routes'),
    doctors: require('../routes/doctor.routes'),
    sessions: require('../routes/session.routes'),
    logs: require('../routes/dailyLog.routes'),
    lactation: require('../routes/lactation.routes'),
    period: require('../routes/period.routes'),
    communities: require('../routes/community.routes'),
    medicines: require('../routes/medicine.routes'),
    ngos: require('../routes/ngo.routes'),
    insurance: require('../routes/insurance.routes'),
    questions: require('../routes/question.routes'),
  };
  const registered = Object.fromEntries(Object.entries(routeGroups).map(([name, router]) => [
    name,
    router.stack
      .filter((layer) => layer.route)
      .flatMap((layer) => Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route.path}`))
      .sort(),
  ]));

  assert.deepEqual(registered.auth, [
    'GET /me', 'POST /doctor/login', 'POST /doctor/register', 'POST /google', 'POST /login', 'POST /register',
  ]);
  assert.deepEqual(registered.users, [
    'DELETE /:id', 'DELETE /me', 'GET /', 'GET /:id', 'GET /me', 'PATCH /:id', 'PATCH /me',
  ]);
  assert.deepEqual(registered.doctors, [
    'DELETE /:id', 'DELETE /:id/hard', 'DELETE /me', 'GET /', 'GET /:id', 'GET /me',
    'PATCH /:id', 'PATCH /me', 'PATCH /me/password', 'POST /',
  ]);
  assert.deepEqual(registered.logs, ['GET /me', 'POST /']);
  assert.deepEqual(registered.lactation, ['DELETE /:id', 'GET /me', 'POST /']);
  assert.deepEqual(registered.period, ['GET /me', 'PATCH /:id', 'POST /']);
  assert.deepEqual(registered.sessions, ['GET /', 'GET /me', 'PATCH /:id/cancel', 'POST /']);
  assert.deepEqual(registered.communities, ['GET /', 'PATCH /:id/join', 'PATCH /:id/leave']);
  assert.deepEqual(registered.medicines, ['GET /']);
  assert.deepEqual(registered.ngos, ['GET /']);
  assert.deepEqual(registered.insurance, ['GET /']);
  assert.deepEqual(registered.questions, [
    'DELETE /:id', 'GET /', 'GET /:id', 'PATCH /:id/upvote', 'POST /', 'POST /:id/answer',
  ]);
});

test('user self-service update filters protected fields and account deletion deactivates', async (t) => {
  const user = { _id: 'user-1', full_name: 'Updated name' };
  let updateResult = query(user);
  const update = t.mock.method(User, 'findByIdAndUpdate', () => updateResult);

  const result = await invoke(userController.updateMe, {
    user: { _id: 'user-1', role: 'user' },
    body: { full_name: 'Updated name', role: 'admin', password: 'secret' },
  });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(update.mock.calls[0].arguments[1], { $set: { full_name: 'Updated name' } });

  updateResult = null;
  const deleted = await invoke(userController.deleteMe, { user: { _id: 'user-1' } });
  assert.equal(deleted.statusCode, 200);
  assert.deepEqual(update.mock.calls[1].arguments[1], { is_active: false });
});

test('admin user routes read, update, and permanently delete records', async (t) => {
  const user = { _id: 'user-2', full_name: 'Member' };
  t.mock.method(User, 'find', () => query([user]));
  t.mock.method(User, 'countDocuments', async () => 1);
  const listed = await invoke(userController.getAllUsers);
  assert.equal(listed.body.total, 1);

  t.mock.method(User, 'findById', () => query(user));
  assert.equal((await invoke(userController.getUser, { params: { id: 'user-2' } })).statusCode, 200);

  const update = t.mock.method(User, 'findByIdAndUpdate', () => query(user));
  const updated = await invoke(userController.updateUser, {
    params: { id: 'user-2' },
    body: { full_name: 'Member', role: 'admin' },
  });
  assert.equal(updated.statusCode, 200);
  assert.deepEqual(update.mock.calls[0].arguments[1], { $set: { full_name: 'Member', role: 'admin' } });

  t.mock.method(User, 'findByIdAndDelete', async () => user);
  const deleted = await invoke(userController.deleteUser, { params: { id: 'user-2' } });
  assert.match(deleted.body.message, /permanently deleted/);
});

test('doctor CRUD supports public reads, admin create/update, and soft or permanent deletion', async (t) => {
  const doctor = asDocument({ _id: 'doctor-1', name: 'Dr One', active: true });
  t.mock.method(Doctor, 'create', async () => doctor);
  const created = await invoke(doctorController.create, {
    body: { name: 'Dr One', specialization: 'OBGYN' },
  });
  assert.equal(created.statusCode, 201);

  t.mock.method(Doctor, 'findById', async () => doctor);
  assert.equal((await invoke(doctorController.getById, { params: { id: 'doctor-1' } })).statusCode, 200);

  const update = t.mock.method(Doctor, 'findByIdAndUpdate', async () => doctor);
  assert.equal((await invoke(doctorController.update, {
    params: { id: 'doctor-1' }, body: { name: 'Dr One Updated' },
  })).statusCode, 200);
  assert.deepEqual(update.mock.calls[0].arguments[1], { $set: { name: 'Dr One Updated' } });

  assert.equal((await invoke(doctorController.remove, { params: { id: 'doctor-1' } })).statusCode, 200);
  assert.deepEqual(update.mock.calls[1].arguments[1], { active: false });

  t.mock.method(Doctor, 'findByIdAndDelete', async () => doctor);
  assert.match((await invoke(doctorController.hardDelete, {
    params: { id: 'doctor-1' },
  })).body.message, /permanently deleted/);
});

test('daily logs create or upsert by owner and date and list only the owner records', async (t) => {
  const log = { _id: 'log-1', user_id: 'user-1' };
  const upsert = t.mock.method(DailyLog, 'findOneAndUpdate', async () => log);
  const created = await invoke(dailyLogController.create, {
    user: { _id: 'user-1' },
    body: { date: '2026-10-28', mood_score: 4 },
  });
  assert.equal(created.statusCode, 201);
  assert.equal(upsert.mock.calls[0].arguments[0].user_id, 'user-1');
  assert.equal(upsert.mock.calls[0].arguments[2].upsert, true);

  const find = t.mock.method(DailyLog, 'find', () => query([log]));
  assert.equal((await invoke(dailyLogController.getMyLogs, {
    user: { _id: 'user-1' },
  })).body.results, 1);
  assert.deepEqual(find.mock.calls[0].arguments[0], { user_id: 'user-1' });
});

test('lactation logs create, list, and delete for the authenticated owner', async (t) => {
  const log = { _id: 'feed-1', user_id: 'user-1' };
  const create = t.mock.method(LactationLog, 'create', async () => log);
  assert.equal((await invoke(lactationController.create, {
    user: { _id: 'user-1' }, body: { feeding_type: 'breastfeeding' },
  })).statusCode, 201);
  assert.equal(create.mock.calls[0].arguments[0].user_id, 'user-1');

  t.mock.method(LactationLog, 'find', () => query([log]));
  assert.equal((await invoke(lactationController.getMyLogs, {
    user: { _id: 'user-1' },
  })).body.results, 1);

  const remove = t.mock.method(LactationLog, 'findOneAndDelete', async () => log);
  assert.equal((await invoke(lactationController.deleteLog, {
    user: { _id: 'user-1' }, params: { id: 'feed-1' },
  })).statusCode, 204);
  assert.deepEqual(remove.mock.calls[0].arguments[0], { _id: 'feed-1', user_id: 'user-1' });
});

test('period logs create, list, and update for the authenticated owner', async (t) => {
  const log = { _id: 'cycle-1', user_id: 'user-1' };
  const create = t.mock.method(PeriodLog, 'create', async () => log);
  assert.equal((await invoke(periodController.create, {
    user: { _id: 'user-1' }, body: { cycle_start: '2026-10-01' },
  })).statusCode, 201);
  assert.equal(create.mock.calls[0].arguments[0].user_id, 'user-1');

  t.mock.method(PeriodLog, 'find', () => query([log]));
  assert.equal((await invoke(periodController.getMyLogs, {
    user: { _id: 'user-1' },
  })).body.results, 1);

  const update = t.mock.method(PeriodLog, 'findOneAndUpdate', async () => log);
  assert.equal((await invoke(periodController.updateLog, {
    user: { _id: 'user-1' }, params: { id: 'cycle-1' }, body: { notes: 'updated' },
  })).statusCode, 200);
  assert.deepEqual(update.mock.calls[0].arguments[0], { _id: 'cycle-1', user_id: 'user-1' });
});

test('sessions book, list, and cancel for owners; all-session listing is controller-supported', async (t) => {
  const doctor = { _id: 'doctor-1', available_for_booking: true, session_fee: 1200 };
  const doctorFind = t.mock.method(Doctor, 'findById', async () => doctor);
  const session = {
    _id: 'session-1',
    populate: async function () { return this; },
    save: async function () {},
    session_status: 'upcoming',
  };
  const create = t.mock.method(Session, 'create', async () => session);
  assert.equal((await invoke(sessionController.book, {
    user: { _id: 'user-1' },
    body: { doctor_id: 'doctor-1', session_date: '2026-11-01', session_time: '10:00' },
  })).statusCode, 201);
  assert.equal(doctorFind.mock.calls[0].arguments[0], 'doctor-1');
  assert.equal(create.mock.calls[0].arguments[0].user_id, 'user-1');
  assert.equal(create.mock.calls[0].arguments[0].session_fee, 1200);

  t.mock.method(Session, 'find', () => query([session]));
  assert.equal((await invoke(sessionController.getMySessions, {
    user: { _id: 'user-1' },
  })).body.results, 1);

  t.mock.method(Session, 'findOne', async () => session);
  const cancelled = await invoke(sessionController.cancel, {
    user: { _id: 'user-1' }, params: { id: 'session-1' }, body: { reason: 'schedule conflict' },
  });
  assert.equal(cancelled.statusCode, 200);
  assert.equal(session.session_status, 'cancelled');
  assert.equal(session.cancelled_reason, 'schedule conflict');
});

test('community membership actions update counts and missing communities return 404', async (t) => {
  const community = { _id: 'community-1', member_count: 2 };
  let result = community;
  const update = t.mock.method(Community, 'findByIdAndUpdate', async () => result);
  assert.equal((await invoke(communityController.join, {
    params: { id: 'community-1' },
  })).statusCode, 200);
  assert.deepEqual(update.mock.calls[0].arguments[1], { $inc: { member_count: 1 } });

  result = null;
  assert.equal((await invoke(communityController.leave, {
    params: { id: 'community-1' },
  })).statusCode, 404);
  assert.deepEqual(update.mock.calls[1].arguments[1], { $inc: { member_count: -1 } });
});

test('list-only reference resources return their active records', async (t) => {
  const medicineRouter = require('../routes/medicine.routes');
  const ngoRouter = require('../routes/ngo.routes');
  const insuranceRouter = require('../routes/insurance.routes');
  const medicine = t.mock.method(Medicine, 'find', () => query([{ name: 'Medicine' }]));
  const ngo = t.mock.method(Ngo, 'find', () => query([{ name: 'NGO' }]));
  const insurance = t.mock.method(InsurancePlan, 'find', () => query([{ scheme_name: 'Plan' }]));

  const invokeList = async (router) => {
    const handler = router.stack.find((layer) => layer.route).route.stack[0].handle;
    return invoke(handler);
  };
  assert.equal((await invokeList(medicineRouter)).body.results, 1);
  assert.equal((await invokeList(ngoRouter)).body.results, 1);
  assert.equal((await invokeList(insuranceRouter)).body.results, 1);
  assert.deepEqual(medicine.mock.calls[0].arguments[0], { is_active: true });
  assert.deepEqual(ngo.mock.calls[0].arguments[0], { active_support: true });
  assert.deepEqual(insurance.mock.calls[0].arguments[0], { active: true });
});

test('question create and delete enforce required input and ownership', async (t) => {
  const invalid = await invoke(questionController.create, {
    user: { _id: 'user-1', role: 'user', email: 'user@example.com' },
    body: { title: 'Question only' },
  });
  assert.equal(invalid.statusCode, 400);

  const question = { _id: 'question-1', author_id: 'user-1' };
  t.mock.method(User, 'findById', () => query({ full_name: 'Member' }));
  t.mock.method(Question, 'create', async () => question);
  const created = await invoke(questionController.create, {
    user: { _id: 'user-1', role: 'user', email: 'user@example.com' },
    body: { title: 'Question', description: 'Details', tags: [' health '] },
  });
  assert.equal(created.statusCode, 201);

  t.mock.method(Question, 'findById', async (id) => id === 'question-1' ? question : null);
  const forbidden = await invoke(questionController.remove, {
    user: { _id: 'user-2', role: 'user' }, params: { id: 'question-1' },
  });
  assert.equal(forbidden.statusCode, 403);

  t.mock.method(Question, 'findByIdAndDelete', async () => question);
  const deleted = await invoke(questionController.remove, {
    user: { _id: 'user-1', role: 'user' }, params: { id: 'question-1' },
  });
  assert.equal(deleted.statusCode, 200);

  const missing = await invoke(questionController.remove, {
    user: { _id: 'user-1', role: 'user' }, params: { id: 'missing' },
  });
  assert.equal(missing.statusCode, 404);
});

test('role guard denies unauthorized operations and allows the required role', () => {
  const requireAdmin = authMiddleware.restrictTo('admin');
  let statusCode;
  let nextCalled = false;
  const res = { status(code) { statusCode = code; return this; }, json() { return this; } };
  requireAdmin({ user: { role: 'user' } }, res, () => { nextCalled = true; });
  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);

  requireAdmin({ user: { role: 'admin' } }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('user routes require authentication and reserve the user list for admins', async (t) => {
  t.mock.method(User, 'findById', () => query({
    _id: 'user-1',
    email: 'member@example.com',
    role: 'user',
    is_active: true,
  }));
  const app = express();
  app.use('/api/users', require('../routes/user.routes'));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/users`;
  const token = jwt.sign({ _id: 'user-1', role: 'user' }, config.jwt.secret);

  const unauthenticated = await fetch(`${baseUrl}/me`);
  assert.equal(unauthenticated.status, 401);

  const forbidden = await fetch(baseUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(forbidden.status, 403);

  const ownProfile = await fetch(`${baseUrl}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(ownProfile.status, 200);
  assert.equal((await ownProfile.json()).data.user._id, 'user-1');
});
