const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModal');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please enter an email and a password', 404));
  }

  // 2) Check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  const userDetails = await User.findOne({ email }); // don't contains the password

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('email or password is incorrect!', 401));
  }

  // 3) Send jwt token
  createSendToken(userDetails, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Getting token and check if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not Logged In!, Please login to get access', 401)
    );
  }
  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to the token no longer exists.', 401)
    );
  }

  // 4) Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

// we made a clousure as the middleware can't be an arguement
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles: ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don't have permission to perform this action", 403)
      );
    }

    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the email and check if exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user exists with that email', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email address
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Please submit a Patch request with your new password and passwordConfirm to: ${resetURL}.\n If you didn't forgot your password, Please ignore the email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to your email address!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There is a problem while sending token. Please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token not expired and there is user then set the new password
  if (!user) {
    return next(new AppError('Token is Invalid or has Expired'));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) update changedPasswordAt property for the user
  // 4) Log In the user, send token
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the details
  const user = await User.findById(req.user._id).select('+password');

  // 2) Check if the password is correct
  const passwordCorrect = await user.correctPassword(
    req.body.passwordCurrent,
    user.password
  );
  if (!passwordCorrect) {
    return next(new AppError('The current password is incorrect!', 401));
  }

  // 3) If correct then update it
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Login in user and send JWT
  const userDetails = await User.findById(req.user._id);
  createSendToken(userDetails, 201, res);
});
