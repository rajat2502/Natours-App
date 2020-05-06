const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your Email ID'],
    unique: true,
    lowercase: true, // tranforms into lowercase
    validate: [validator.isEmail, 'Please provide a valid Email ID'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // son't send the password
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // Works only on create() and save()
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords don't match",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// this middleware is used to encrypt the password when the user
// sign up for the first time or when he/she modifies it
userSchema.pre('save', async function (next) {
  // Work only when password is modified
  if (!this.isModified('password')) {
    return next();
  }

  // Encrypt password at the cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm
  this.passwordConfirm = undefined; // remove it from db
  next();
});

// Whenever password changes then save the time in passwordChangedAt
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  return await bcrypt.compare(candidatePassword, userPassword); // we can't compare them with any other method
};

userSchema.methods.changedPasswordAfter = function (JWTTimesStamp) {
  if (this.passwordChangedAt) {
    const changedAtTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimesStamp < changedAtTimeStamp;
  }

  // False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken, passwordResetToken: this.passwordResetToken });

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
