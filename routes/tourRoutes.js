const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkId);

// POST /tour/656hgh/reviews
// GET /tour/656hgh/reviews

router.use('/:tourId/reviews', reviewRouter);

// alias route
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getTours);

// stats route
router.route('/tour-stats').get(tourController.getTourStats);

// monthly plan route
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, tourController.getTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
