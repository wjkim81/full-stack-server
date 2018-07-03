const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200)} )
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  //console.log('favorites');
  Favorites.findOne({"user": req.user._id})
  .populate('user')
  .populate('dishes')
  .then((favorites) => {
    //console.log(favorites);
    if (favorites !== null) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(favorites);
    } else {
      err = new Error('User ' + req.user._id + ' does not have any favorites');
      err.status = 404;
      return next(err);
    }
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne({"user": req.user._id})
  .then((favorite) => {
    if (favorite != null) {
      //console.log("favorite.dishes: ", favorite.dishes);
      //console.log("req.body: ", req.body);
      for (var i = 0; i < req.body.length; i++) {
        //console.log(req.body[i]._id);
        //console.log(favorite.dishes.indexOf(req.body[i]._id));
        if (favorite.dishes.indexOf(req.body[i]._id) === -1) {
          favorite.dishes.push(req.body[i]._id);
          //console.log("favorite.dishes: ", favorite.dishes);
        }
      }
    } else {
      favorite = new Favorites();
      favorite.user = req.user._id;
      //console.log(favorite);
      for (var i = 0; i < req.body.length; i++) {
        favorite.dishes.push(req.body[i]._id);
      }
    }
    //console.log(favorite);
    favorite.save()
    .then((favorite) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(favorite);
      }, (err) => next(err));
  }, (err) => next(err))
  .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.remove({"user": req.user._id})
  .then((resp) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(resp);
  }, (err) => next(err))
  .catch((err) => next(err));    
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200)} )
.get(cors.cors, (req,res,next) => {
  Favorites.findOne({user: req.user._id})
  .then((favorites) => {
    if (!favorites) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.json({"exists": false, "favorites": favorites});
    } else {
      if (favorites.dishes.indexOf(req.params.dishId) < 0) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.json({"exists": false, "favorites": favorites});
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.json({"exists": true, "favorites": favorites});
      }
    }
  }, (err) => next(err))
  .catch((err) => next(err));
  //res.statusCode = 403;
  //res.end('GET operation not supported on /favorites/' + req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Favorites.findOne({"user": req.user._id})
  .then((favorite) => {
    if (favorite != null) {
      if (favorite.dishes.indexOf(req.params.dishId) === -1) {
        favorite.dishes.push(req.params.dishId);
      }
      favorite.save()
      .then((favorite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
        }, (err) => next(err));
    } else {
      err = new Error('User ' + req.user._id + ' does not have any favorites');
      err.status = 404;
      return next(err);
    }
  }, (err) => next(err))
  .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  //console.log(req.params.dishId);
  Favorites.findOne({"user": req.user._id})
  .then((favorite) => {
    if (favorite != null) {
      //console.log(favorite.dishes);
      let index = favorite.dishes.indexOf(req.params.dishId);
      //console.log('index: ', index);
      if (index >= 0) {
        favorite.dishes.splice(index, 1);
        favorite.save()
        .then((favorite) => {
          Favorites.findById(favorite._id)
          .populate('user')
          .populate('dishes')
          .then((favorite) => {
            console.log('Favorite Dish Deleted!');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
          })
        }, (err) => next(err));
      } else {
        //console.log('not favorited');
        err = new Error('User ' + req.user._id + ' has not favorited dish ' + req.params.dishId);
        err.status = 404;
        return next(err);
      }
    } else {
      err = new Error('User ' + req.user._id + ' does not have any favorites');
      err.status = 404;
      return next(err);
    }
  }, (err) => next(err))
  .catch((err) => next(err));
});

module.exports = favoriteRouter;