const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

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

// Read File Data
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8')
);

// Import data to DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data Successfully Loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete data from DB collections
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data Deleted Successfully!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// node /dev-data/data/import-dev-data.js --import
// node /dev-data/data/import-dev-data.js --delete

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}