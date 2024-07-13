import { Request, Response, NextFunction } from "express";

export const validateInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { otp, email, fullName, password } = req.body as {
    otp: string;
    email: string;
    fullName: string;
    password: string;
  };

  const inputs = [ otp, email, fullName, password];
  for (const input of inputs) {
    if (!isValidInput(input)) {
      return res.status(400).json({
        success: false,
        message: `Invalid characters in input: ${input}`,
      });
    }
  }

  next();
};

const isValidInput = (input: string): boolean => {
  const regex = /^(?!\s*$)[a-zA-Z0-9 !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
  return regex.test(input);
};
