export const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const verificationTypes = {
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESEND_CODE: 'RESEND_CODE',
  TWO_FA: 'TWO_FA',
};
