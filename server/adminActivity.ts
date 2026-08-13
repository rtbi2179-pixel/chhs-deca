export type AdministratorActivityAction = "feedback_reviewed" | "user_promoted_to_admin" | "user_demoted_from_admin";

export function createAdministratorActivityRecord(input: {
  schoolCode: string;
  actorUserId: number;
  action: AdministratorActivityAction;
  targetType: "feedback" | "user";
  targetId: string;
  details: Record<string, unknown>;
}) {
  return {
    schoolCode: input.schoolCode,
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    details: JSON.stringify(input.details),
  };
}
