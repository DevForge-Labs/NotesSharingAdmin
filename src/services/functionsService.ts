import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

const functionsInstance = getFunctions(app, 'us-central1');

export interface SetUserRoleParams {
  targetUid: string;
  targetRole: 'user' | 'admin' | 'superadmin';
  reason?: string;
}

export interface DisableUserParams {
  targetUid: string;
  reason: string;
}

export interface EnableUserParams {
  targetUid: string;
  reason?: string;
}

export interface DeleteAuthAccountParams {
  targetUid: string;
  reason?: string;
}

export const setUserRoleCallable = async (params: SetUserRoleParams) => {
  const func = httpsCallable<SetUserRoleParams, any>(functionsInstance, 'setUserRole');
  const result = await func(params);
  return result.data;
};

export const disableUserCallable = async (params: DisableUserParams) => {
  const func = httpsCallable<DisableUserParams, any>(functionsInstance, 'disableUser');
  const result = await func(params);
  return result.data;
};

export const enableUserCallable = async (params: EnableUserParams) => {
  const func = httpsCallable<EnableUserParams, any>(functionsInstance, 'enableUser');
  const result = await func(params);
  return result.data;
};

export const deleteAuthAccountCallable = async (params: DeleteAuthAccountParams) => {
  const func = httpsCallable<DeleteAuthAccountParams, any>(functionsInstance, 'deleteAuthAccount');
  const result = await func(params);
  return result.data;
};

export const bootstrapAdminClaimsCallable = async () => {
  const func = httpsCallable<void, any>(functionsInstance, 'bootstrapAdminClaims');
  const result = await func();
  return result.data;
};
