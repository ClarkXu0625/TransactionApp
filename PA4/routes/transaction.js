const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const User = require('../models/User');
const mongoose = require('mongoose');

isLoggedIn = (req, res, next) => {
  if (res.locals.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
};

router.get('/transaction/', 
  isLoggedIn, 
  async (req, res, next) => {
    // Retrieves the sortBy query parameter from the request (req.query.sortBy). 
    // If the sortBy parameter is not provided, it defaults to 'date'.
    const sortBy = req.query.sortBy || 'date'; 

    // Set to ascending order if not specified
    const sortOrder = req.query.sortOrder || 'asc';

    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

  res.render('transaction/index', { transactions });
});

router.post('/transaction', 
  isLoggedIn, 
  async (req, res, next) => {
    const { description, amount, category, date } = req.body;
    const transaction = new Transaction({
      description,
      amount,
      category,
      date,
      userId: req.user._id,
    });
    await transaction.save();
    res.redirect('/transaction');
});

router.post('/transaction/remove/:transactionId', 
  isLoggedIn, 
  async (req, res, next) => {
    await Transaction.deleteOne({ _id: req.params.transactionId });
    res.redirect('/transaction');
});

router.get('/transaction/edit/:transactionId', 
  isLoggedIn, 
  async (req, res, next) => {
    const transaction = await Transaction.findById(req.params.transactionId);
    res.locals.transaction = transaction;
    res.render('transaction/edit');
});

router.post('/transaction/updateTransaction', 
  isLoggedIn, 
  async (req, res, next) => {
    const { transactionId, description, amount, category, date } = req.body;
    await Transaction.findOneAndUpdate(
      { _id: transactionId },
      { $set: { description, amount, category, date } },
    );
    res.redirect('/transaction');
});

router.get('/transaction/byCategory', isLoggedIn, async (req, res, next) => {
  const userId = req.user._id;
  
  // Query the database and group transactions by category
  const transactionsByCategory = await Transaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } },
    { $sort: { _id: 1 } }
  ]);

  res.render('transaction/byCategory', { transactionsByCategory });
});


module.exports = router;
