import Joi, { ObjectSchema } from 'joi';

const signupSchema: ObjectSchema = Joi.object().keys({
  name: Joi.string().min(4).max(50).required().pattern(new RegExp('^[a-zA-Z ]+$')).messages({
    'string.base': 'Name must be of type string',
    'string.min': 'Invalid Name min length',
    'string.max': 'Invalid Name max length',
    'string.empty': 'Name is a required field',
    'string.pattern.base': 'Name can only contain English letters'
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email must be of type string',
    'string.email': 'Invalid email',
    'string.empty': 'Email is a required field'
  }),
  password: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Password must be of type string',
    'string.min': 'Invalid password',
    'string.max': 'Invalid password',
    'string.empty': 'Password is a required field'
  }),
  confirmPassword: Joi.string().min(4).max(12).required().messages({
    'string.base': 'Password Repeat must be of type string',
    'string.min': 'Invalid Password Repeat',
    'string.max': 'Invalid Password Repeat',
    'string.empty': 'Password Repeat is a required field'
  }),
  // country: Joi.string().required().messages({
  //   'string.base': 'Country must be of type string',
  //   'string.empty': 'Country is a required field'
  // }),
  browserName: Joi.string().optional(),
  deviceType: Joi.string().optional()
});

export { signupSchema };
