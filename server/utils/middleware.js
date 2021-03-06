const jwt = require('jsonwebtoken');
const logger = require('./logger');
const User = require('../models/user');
const Owner = require('../models/owner');

const requestLogger = (request, response, next) => {
  logger.info('Method: ', request.method);
  logger.info('Path: ', request.path);
  logger.info('Body: ', request.body);
  logger.info('---');
  next();
};

const tokenExtractor = (request, response, next) => {
  const getTokenFrom = () => {
    const authorization = request.get('authorization');
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
      return authorization.substring(7);
    }
    return null;
  };
  request.token = getTokenFrom(request);

  next();
};

const userExtractor = async (request, response, next) => {
  const { token } = request;

  const decodeToken = jwt.verify(token, process.env.SECRET);

  if (decodeToken) {
    request.user = await User.findById(decodeToken.id);
  } else {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  next();
};

const ownerExtractor = async (request, response, next) => {
  const { token } = request;

  const decodeToken = jwt.verify(token, process.env.SECRET);

  if (decodeToken) {
    request.owner = await Owner.findById(decodeToken.id);
  } else {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  next();
};

const unknownEndpoint = async (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

const errorHandler = (error, request, response, next) => {
  logger.error(error.message);

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return response.status(400).send({ error: 'malformed id' });
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }

  next(error);
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
  ownerExtractor,
};
