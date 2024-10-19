import Joi, { ObjectSchema } from 'joi';

const loginSchema: ObjectSchema = Joi.object().keys({
  username: Joi.alternatives().conditional(Joi.string().email(), {
    then: Joi.string().email().required().messages({
      'string.base': 'Email must be of type string',
      'string.email': 'Invalid email',
      'string.empty': 'Email is a required field'
    }),
    otherwise: Joi.string().min(4).max(12).required().messages({
      'string.base': 'Username must be of type string',
      'string.min': 'Invalid username',
      'string.max': 'Invalid username',
      'string.empty': 'Username is a required field'
    })
  }),
  password: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Invalid password',
    'string.max': 'Invalid password',
    'string.empty': 'Password is a required field'
  }),
  browserName: Joi.string().optional(),
  deviceType: Joi.string().optional()
});


const loginSchemaByPhone: ObjectSchema = Joi.object().keys({
  phone: Joi.string().min(11).max(11).required().messages({
    'string.base': 'Phone must be of type string',
    'string.min': 'Invalid Phone',
    'string.max': 'Invalid Phone',
    'string.empty': 'Phone is a required field'
  })
});

export { loginSchema, loginSchemaByPhone };
