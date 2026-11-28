import {
  acceptInvitationResponseSchema,
  conditionReportSchema,
  conditionReportRequestSchema,
  conditionReportsSchema,
  importMotorcycleResponseSchema,
  motorcycleInvitationRequestSchema,
  motorcycleInvitationResponseSchema,
  pushDeviceRequestSchema,
  pushDeviceResponseSchema,
  remoteMotorcyclesSchema,
  sharedInvitationsSchema,
  type ConditionReport,
  type ConditionReportRequest,
  type RemoteMotorcycle,
  type SharedInvitation,
} from './contracts';
import type { AuthSession } from './session';

export type ImportMotorcycleRequest = {
  readonly importKey: string;
  readonly name: string;
  readonly odometerKm: number;
};

export interface AccountMotorcycleApi {
  importMotorcycle(request: ImportMotorcycleRequest): Promise<string>;
  listMotorcycles(signal?: AbortSignal): Promise<readonly RemoteMotorcycle[]>;
}

export class AccountApi implements AccountMotorcycleApi {
  constructor(private readonly session: AuthSession) {}

  async importMotorcycle(request: ImportMotorcycleRequest): Promise<string> {
    const response = await this.session.request({ path: 'motorcycles/import', method: 'POST', json: request });
    return importMotorcycleResponseSchema.parse(response).id;
  }

  async listMotorcycles(signal?: AbortSignal): Promise<readonly RemoteMotorcycle[]> {
    const response = await this.session.request({
      path: 'motorcycles',
      method: 'GET',
      ...(signal === undefined ? {} : { signal }),
    });
    return remoteMotorcyclesSchema.parse(response);
  }

  async listInvitations(signal?: AbortSignal): Promise<readonly SharedInvitation[]> {
    const response = await this.session.request({
      path: 'invitations',
      method: 'GET',
      ...(signal === undefined ? {} : { signal }),
    });
    return sharedInvitationsSchema.parse(response);
  }

  async acceptInvitation(invitationId: string): Promise<string> {
    const response = await this.session.request({ path: `invitations/${invitationId}/accept`, method: 'POST' });
    return acceptInvitationResponseSchema.parse(response).motorcycleId;
  }

  async inviteMotorcycle(motorcycleId: string, email: string): Promise<string> {
    const request = motorcycleInvitationRequestSchema.parse({ email });
    const response = await this.session.request({ path: `motorcycles/${motorcycleId}/invitations`, method: 'POST', json: request });
    return motorcycleInvitationResponseSchema.parse(response).id;
  }

  async listReports(motorcycleId: string, signal?: AbortSignal): Promise<readonly ConditionReport[]> {
    const response = await this.session.request({
      path: `motorcycles/${motorcycleId}/reports`,
      method: 'GET',
      ...(signal === undefined ? {} : { signal }),
    });
    return conditionReportsSchema.parse(response);
  }

  async createReport(motorcycleId: string, request: ConditionReportRequest): Promise<ConditionReport> {
    const response = await this.session.request({
      path: `motorcycles/${motorcycleId}/reports`,
      method: 'POST',
      json: conditionReportRequestSchema.parse(request),
    });
    return conditionReportSchema.parse(response);
  }

  async registerPushDevice(token: string): Promise<string> {
    const response = await this.session.request({ path: 'push-devices', method: 'POST', json: pushDeviceRequestSchema.parse({ token }) });
    return pushDeviceResponseSchema.parse(response).token;
  }
}
