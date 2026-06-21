import { getToken } from "next-auth/jwt";

export async function getAuthUser(request: Request) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.sub) return null;

  return {
    id: token.sub,
    email: token.email as string | undefined,
    role: (token.role as string) || "user",
  };
}
