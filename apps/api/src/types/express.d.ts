import type { Organization, Role } from "@prisma/client";
import type { PublicUser } from "../auth/service.js";

// Augment Express's Request so requireAuth can attach the resolved identity.
declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: PublicUser;
        org: Organization;
        role: Role;
        membershipId: string;
      };
    }
  }
}

export {};
