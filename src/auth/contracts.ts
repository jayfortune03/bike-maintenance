import * as z from 'zod';

export const AUTH_PASSWORD_MIN = 12;
export const AUTH_PASSWORD_MAX = 128;

export const authCredentialsSchema = z.strictObject({
  email: z.preprocess(
    (value) => typeof value === 'string' ? value.trim().toLowerCase() : value,
    z.email().max(254),
  ),
  password: z.string().min(AUTH_PASSWORD_MIN).max(AUTH_PASSWORD_MAX),
}).readonly();

export const sessionUserSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  createdAt: z.iso.datetime(),
}).readonly();

export const authPayloadSchema = z.strictObject({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.literal(900),
  refreshToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  refreshExpiresAt: z.iso.datetime(),
  sessionExpiresAt: z.iso.datetime(),
  user: sessionUserSchema,
}).readonly();

export const remoteMotorcycleSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  odometerKm: z.number().int().min(0).max(2_147_483_647),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  members: z.array(z.strictObject({ role: z.enum(['OWNER', 'EDITOR', 'VIEWER']) }).readonly()).length(1),
}).readonly();

export const remoteMotorcyclesSchema = z.array(remoteMotorcycleSchema).readonly();
export const importMotorcycleResponseSchema = z.strictObject({ id: z.uuid() }).readonly();

export const sharedInvitationsSchema = z.array(z.strictObject({
  id: z.uuid(),
  motorcycleName: z.string().min(1),
}).readonly()).readonly();

export const conditionReportSchema = z.strictObject({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  authorEmail: z.email(),
  odometerKm: z.number().int().min(0).max(2_147_483_647),
  fuelBars: z.number().int().min(0).max(6),
  note: z.string(),
}).readonly();

export const conditionReportsSchema = z.array(conditionReportSchema).readonly();
export const motorcycleInvitationResponseSchema = z.strictObject({ id: z.uuid() }).readonly();
export const acceptInvitationResponseSchema = z.strictObject({ motorcycleId: z.uuid() }).readonly();
export const motorcycleInvitationRequestSchema = z.strictObject({
  email: z.preprocess((value) => typeof value === 'string' ? value.trim().toLowerCase() : value, z.email().max(254)),
}).readonly();
export const conditionReportRequestSchema = z.strictObject({
  odometerKm: z.number().int().min(0).max(2_147_483_647),
  fuelBars: z.number().int().min(0).max(6),
  note: z.string(),
}).readonly();
const expoPushTokenSchema = z.string().regex(/^Expo(?:nent)?PushToken\[[A-Za-z0-9_-]+\]$/);
export const pushDeviceRequestSchema = z.strictObject({ token: expoPushTokenSchema }).readonly();
export const pushDeviceResponseSchema = z.strictObject({ token: expoPushTokenSchema }).readonly();

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;
export type AuthPayload = z.infer<typeof authPayloadSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type RemoteMotorcycle = z.infer<typeof remoteMotorcycleSchema>;
export type RemoteMotorcycleRole = RemoteMotorcycle['members'][number]['role'];
export type SharedInvitation = z.infer<typeof sharedInvitationsSchema>[number];
export type ConditionReport = z.infer<typeof conditionReportSchema>;
export type ConditionReportRequest = z.infer<typeof conditionReportRequestSchema>;
export type AuthMode = 'login' | 'register';
