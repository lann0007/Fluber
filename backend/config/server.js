module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys:["mHVoLNh2U5","WDqVWWM4sv"],
  },
});
