import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
      return;
    }

    next();
  };
