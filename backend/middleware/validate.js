const Joi = require('joi');

// Generic validation middleware factory
const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });
    if (error) {
      return res.status(422).json({
        message: 'Validation Error',
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message.replace(/['"]/g, ''),
        })),
      });
    }
    req[target] = value;
    next();
  };
};

// ─── Auth Schemas ──────────────────────────────────────────────────────────────
const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('admin', 'faculty', 'student').default('student'),
    rollNumber: Joi.string().when('role', { is: 'student', then: Joi.required() }),
    course: Joi.string().when('role', { is: 'student', then: Joi.required() }),
    year: Joi.number().integer().min(1).max(6).when('role', { is: 'student', then: Joi.required() }),
    branch: Joi.string().optional(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional().messages({ 'string.pattern.base': 'Please enter a valid 10-digit Indian mobile number' }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    password: Joi.string().min(6).max(128).required(),
  }),
};

// ─── Student Schemas ───────────────────────────────────────────────────────────
const studentSchemas = {
  create: Joi.object({
    userId: Joi.string().required(),
    rollNumber: Joi.string().required(),
    course: Joi.string().required(),
    year: Joi.number().integer().min(1).max(6).required(),
    branch: Joi.string().optional(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    address: Joi.string().max(200).optional(),
  }),

  update: Joi.object({
    course: Joi.string().optional(),
    year: Joi.number().integer().min(1).max(6).optional(),
    branch: Joi.string().optional(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    address: Joi.string().max(200).optional(),
  }),
};

// ─── Result Schemas ────────────────────────────────────────────────────────────
const resultSchemas = {
  create: Joi.object({
    studentId: Joi.string().required(),
    subject: Joi.string().max(100).required(),
    semester: Joi.number().integer().min(1).max(12).required(),
    assignmentMarks: Joi.number().min(0).max(30).default(0),
    testMarks: Joi.number().min(0).max(30).default(0),
    projectMarks: Joi.number().min(0).max(40).default(0),
  }),

  update: Joi.object({
    subject: Joi.string().max(100).optional(),
    semester: Joi.number().integer().min(1).max(12).optional(),
    assignmentMarks: Joi.number().min(0).max(30).optional(),
    testMarks: Joi.number().min(0).max(30).optional(),
    projectMarks: Joi.number().min(0).max(40).optional(),
  }),
};

// ─── Fee Schemas ───────────────────────────────────────────────────────────────
const feeSchemas = {
  create: Joi.object({
    studentId: Joi.string().required(),
    semester: Joi.number().integer().min(1).max(12).required(),
    totalFees: Joi.number().positive().required(),
    paidAmount: Joi.number().min(0).default(0),
    lateFee: Joi.number().min(0).default(0),
    dueDate: Joi.date().optional(),
    description: Joi.string().max(300).optional(),
    installments: Joi.array().optional(),
  }),

  payment: Joi.object({
    amount: Joi.number().positive().required(),
    method: Joi.string().valid('cash', 'online', 'cheque', 'dd', 'other').default('cash'),
    note: Joi.string().max(200).optional(),
    transactionId: Joi.string().optional(),
    receiptNo: Joi.string().optional(),
  }),

  update: Joi.object({
    paidAmount: Joi.number().min(0).optional(),
    totalFees: Joi.number().positive().optional(),
    dueDate: Joi.date().optional(),
    description: Joi.string().max(300).optional(),
    lateFee: Joi.number().min(0).optional(),
  }),
};

module.exports = { validate, authSchemas, studentSchemas, resultSchemas, feeSchemas };
