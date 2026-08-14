import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { resolveDesignatedOwnerSchoolScope } from "../ownerSchoolScope";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
    
    // Safeguard: Ensure rtbi2179@gmail.com is always a super_admin
    if (user && user.email === 'rtbi2179@gmail.com' && user.role !== 'super_admin') {
      user = { ...user, role: 'super_admin' };
    }
    if (user) {
      user = resolveDesignatedOwnerSchoolScope(user);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
