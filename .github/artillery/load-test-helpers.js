module.exports = {
  generateRandomEmail,
  generateRandomString,
};

function generateRandomEmail(context, events, done) {
  const randomString = Math.random().toString(36).substring(7);
  context.vars.email = `test${randomString}@example.com`;
  return done();
}

function generateRandomString(context, events, done) {
  const randomString = Math.random().toString(36).substring(7);
  context.vars.randomString = randomString;
  return done();
}