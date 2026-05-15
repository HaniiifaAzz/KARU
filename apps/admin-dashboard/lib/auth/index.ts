import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { activityLogs, user } from "../db/schema";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    emailAndPassword: {
        enabled: true
    },
    databaseHooks: {
        user: {
            create: {
                after: async (createdUser) => {
                    await db.insert(activityLogs).values({
                        type: 'auth',
                        action: 'Registrasi',
                        description: `Pengguna baru ${createdUser.name} telah terdaftar di sistem.`,
                        userId: createdUser.id,
                        userName: createdUser.name,
                        userRole: (createdUser as any).role || 'pengguna',
                        ipAddress: '127.0.0.1',
                    });
                },
            },
        },
        session: {
            create: {
                after: async (session) => {
                    const [foundUser] = await db.select().from(user).where(eq(user.id, session.userId)).limit(1);

                    if (foundUser) {
                        await db.insert(activityLogs).values({
                            type: 'auth',
                            action: 'Login',
                            description: `Pengguna ${foundUser.name} berhasil masuk ke sistem.`,
                            userId: foundUser.id,
                            userName: foundUser.name,
                            userRole: foundUser.role || 'pengguna',
                            ipAddress: session.ipAddress || '127.0.0.1',
                        });
                    }
                },
            },
            delete: {
                after: async (session) => {
                    const [foundUser] = await db.select().from(user).where(eq(user.id, session.userId)).limit(1);

                    if (foundUser) {
                        await db.insert(activityLogs).values({
                            type: 'auth',
                            action: 'Logout',
                            description: `Pengguna ${foundUser.name} telah keluar dari sistem.`,
                            userId: foundUser.id,
                            userName: foundUser.name,
                            userRole: foundUser.role || 'pengguna',
                            ipAddress: session.ipAddress || '127.0.0.1',
                        });
                    }
                },
            },
        },
    }


});


