import { HttpInterceptorFn } from '@angular/common/http';

export const simpleInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('HTTP Request:', req.url);
  return next(req);
};