const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        status: 401,
        message: 'No token provided'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        status: 401,
        message: 'Invalid or expired token'
      }
    });
  }
};

const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        status: 401,
        message: 'Authentication required'
      }
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        status: 403,
        message: 'Admin access required'
      }
    });
  }

  next();
};

module.exports = {
  verifyToken,
  verifyAdmin
};
