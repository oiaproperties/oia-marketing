import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { Resend } from "resend";
import { prisma } from "./prisma";

export type UserRole = "ADMIN" | "CONTENT_CREATOR" | "SEO_SPECIALIST" | "SOCIAL_MANAGER";

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Admin password login — works without Resend, for local access
    CredentialsProvider({
      id: "admin-password",
      name: "Admin Password",
      credentials: {
        password: { label: "Admin Password", type: "password" },
      },
      async authorize(credentials) {
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword || credentials?.password !== adminPassword) return null;

        const adminEmail = process.env.ADMIN_EMAIL || "admin@oiadubai.com";
        // Upsert admin user
        const user = await prisma.user.upsert({
          where: { email: adminEmail },
          update: { role: "ADMIN" },
          create: { email: adminEmail, name: "Admin", role: "ADMIN" },
        });
        return { id: user.id, email: user.email, name: user.name, role: "ADMIN" };
      },
    }),

    // Email magic link — used for inviting team members
    EmailProvider({
      from: "OIA — Marketing <noreply@oiadubai.com>",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_your_key_here") {
          // No Resend key — log the link to console for dev
          console.log(`\n🔗 SIGN-IN LINK for ${email}:\n${url}\n`);
          return;
        }
        await resend.emails.send({
          from: "OIA — Marketing <noreply@oiadubai.com>",
          to: email,
          subject: "Sign in to OIA — Marketing",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
              <div style="background:#B8860B;color:#fff;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:700;font-size:18px;margin-bottom:24px;">OIA</div>
              <h2 style="margin:0 0 8px;color:#111;">Sign in to OIA Marketing</h2>
              <p style="color:#555;margin:0 0 24px;">Click the button below to sign in. This link expires in 24 hours.</p>
              <a href="${url}" style="background:#B8860B;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Sign In</a>
              <p style="color:#999;font-size:12px;margin-top:32px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role as UserRole;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || "CONTENT_CREATOR";
        // For email-provider sign-ins, look up the role from DB
        if (!(user as any).role) {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          token.role = dbUser?.role || "CONTENT_CREATOR";
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  session: { strategy: "jwt" },
};
