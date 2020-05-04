const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT_EXCEPTION!!! Shutting down server.');
  process.exit(1); // 1 used for exit with failure
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.port || 3000;
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`App running on port ${port}...`);
});

// unhandled rejection like port already in use, db password incorrect
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED_REJECTION!!! Shutting down server.');
  server.close(() => {
    process.exit(1);
  });
});
