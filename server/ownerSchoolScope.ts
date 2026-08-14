import type { User } from "../drizzle/schema";
import { ENV } from "./_core/env";

const DEFAULT_OWNER_SCHOOL_CODE = "1234567";
const DESIGNATED_OWNER_NAMES = new Set([
  "sahan mallampati",
  "ricardo burciaga",
  "ricardob",
]);

type OwnerScopeUser = Pick<User, "openId" | "name" | "schoolCode" | "selectedSchoolCode">;

export function isDesignatedOwner(user: OwnerScopeUser) {
  if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) return true;
  return DESIGNATED_OWNER_NAMES.has((user.name ?? "").trim().toLocaleLowerCase());
}

/**
 * Keeps normal member chapter isolation unchanged, but gives the two designated
 * site owners a dependable chapter scope when older accounts lack a school code.
 */
export function resolveDesignatedOwnerSchoolScope<T extends OwnerScopeUser>(user: T): T {
  if (!isDesignatedOwner(user) || user.schoolCode || user.selectedSchoolCode) return user;
  return {
    ...user,
    schoolCode: DEFAULT_OWNER_SCHOOL_CODE,
    selectedSchoolCode: DEFAULT_OWNER_SCHOOL_CODE,
  };
}
