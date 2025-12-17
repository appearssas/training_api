import * as bcrypt from 'bcrypt';

export const hashPassword = (password: string): string => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

export const comparePassword = (
  password: string,
  hashedPassword: string,
): boolean => {
  return bcrypt.compareSync(password, hashedPassword);
};
