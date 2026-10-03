import { SetMetadata } from '@nestjs/common';


export const META_ROLES = 'role';

export const RolProtected = (...args: string[]) => {
  // if (args && args.length > 0) args.push(string.dev);      //Allow all endpoints for dev role

  return SetMetadata(META_ROLES, args);
};
