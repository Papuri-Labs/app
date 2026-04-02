import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migration script to add multi-tenant architecture
 * This creates a default organization and migrates all existing data
 * 
 * Run this ONCE with: npx convex run migrations/001_add_organizations:migrate
 */
export const migrate = internalMutation({
    args: {},
    handler: async (ctx) => {
        console.log("Starting migration: Adding organizations...");

        // Step 1: Create default organization for your church
        const existingOrg = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", "my-church"))
            .first();

        let orgId;
        if (existingOrg) {
            console.log("Organization already exists, using existing ID");
            orgId = existingOrg._id;
        } else {
            orgId = await ctx.db.insert("organizations", {
                name: "My Church", // TODO: Change this to your church name
                slug: "my-church",
                plan: "self-hosted",
                status: "active",
                createdAt: Date.now(),
            });
            console.log(`Created organization with ID: ${orgId}`);
        }

        // Step 2: Migrate users
        const users = await ctx.db.query("users").collect();
        let userCount = 0;
        for (const user of users) {
            if (!(user as any).organizationId) {
                await ctx.db.patch(user._id, { organizationId: orgId } as any);
                userCount++;
            }
        }
        console.log(`Migrated ${userCount} users`);

        // Step 3: Migrate ministries
        const ministries = await ctx.db.query("ministries").collect();
        let ministryCount = 0;
        for (const ministry of ministries) {
            if (!(ministry as any).organizationId) {
                await ctx.db.patch(ministry._id, { organizationId: orgId } as any);
                ministryCount++;
            }
        }
        console.log(`Migrated ${ministryCount} ministries`);

        // Step 4: Migrate events
        const events = await ctx.db.query("events").collect();
        let eventCount = 0;
        for (const event of events) {
            if (!(event as any).organizationId) {
                await ctx.db.patch(event._id, { organizationId: orgId } as any);
                eventCount++;
            }
        }
        console.log(`Migrated ${eventCount} events`);

        // Step 5: Migrate announcements
        const announcements = await ctx.db.query("announcements").collect();
        let announcementCount = 0;
        for (const announcement of announcements) {
            if (!(announcement as any).organizationId) {
                await ctx.db.patch(announcement._id, { organizationId: orgId } as any);
                announcementCount++;
            }
        }
        console.log(`Migrated ${announcementCount} announcements`);

        // Step 6: Migrate attendance
        const attendance = await ctx.db.query("attendance").collect();
        let attendanceCount = 0;
        for (const record of attendance) {
            if (!(record as any).organizationId) {
                await ctx.db.patch(record._id, { organizationId: orgId } as any);
                attendanceCount++;
            }
        }
        console.log(`Migrated ${attendanceCount} attendance records`);

        // Step 7: Migrate rsvps
        const rsvps = await ctx.db.query("rsvps").collect();
        let rsvpCount = 0;
        for (const rsvp of rsvps) {
            if (!(rsvp as any).organizationId) {
                await ctx.db.patch(rsvp._id, { organizationId: orgId } as any);
                rsvpCount++;
            }
        }
        console.log(`Migrated ${rsvpCount} RSVPs`);

        // Step 8: Migrate bulletins
        const bulletins = await ctx.db.query("bulletins").collect();
        let bulletinCount = 0;
        for (const bulletin of bulletins) {
            if (!(bulletin as any).organizationId) {
                await ctx.db.patch(bulletin._id, { organizationId: orgId } as any);
                bulletinCount++;
            }
        }
        console.log(`Migrated ${bulletinCount} bulletins`);

        // Step 9: Migrate services
        const services = await ctx.db.query("services").collect();
        let serviceCount = 0;
        for (const service of services) {
            if (!(service as any).organizationId) {
                await ctx.db.patch(service._id, { organizationId: orgId } as any);
                serviceCount++;
            }
        }
        console.log(`Migrated ${serviceCount} services`);

        // Step 10: Migrate giving_options
        const givingOptions = await ctx.db.query("giving_options").collect();
        let givingCount = 0;
        for (const option of givingOptions) {
            if (!(option as any).organizationId) {
                await ctx.db.patch(option._id, { organizationId: orgId } as any);
                givingCount++;
            }
        }
        console.log(`Migrated ${givingCount} giving options`);

        // Step 11: Migrate onboarding_steps
        const onboardingSteps = await ctx.db.query("onboarding_steps").collect();
        let stepCount = 0;
        for (const step of onboardingSteps) {
            if (!(step as any).organizationId) {
                await ctx.db.patch(step._id, { organizationId: orgId } as any);
                stepCount++;
            }
        }
        console.log(`Migrated ${stepCount} onboarding steps`);

        // Step 12: Migrate user_onboarding_progress
        const progress = await ctx.db.query("user_onboarding_progress").collect();
        let progressCount = 0;
        for (const p of progress) {
            if (!(p as any).organizationId) {
                await ctx.db.patch(p._id, { organizationId: orgId } as any);
                progressCount++;
            }
        }
        console.log(`Migrated ${progressCount} onboarding progress records`);

        // Step 13: Migrate settings
        const settings = await ctx.db.query("settings").collect();
        let settingsCount = 0;
        for (const setting of settings) {
            if (!(setting as any).organizationId) {
                await ctx.db.patch(setting._id, { organizationId: orgId } as any);
                settingsCount++;
            }
        }
        console.log(`Migrated ${settingsCount} settings records`);

        console.log("✅ Migration complete!");
        return {
            organizationId: orgId,
            migrated: {
                users: userCount,
                ministries: ministryCount,
                events: eventCount,
                announcements: announcementCount,
                attendance: attendanceCount,
                rsvps: rsvpCount,
                bulletins: bulletinCount,
                services: serviceCount,
                givingOptions: givingCount,
                onboardingSteps: stepCount,
                progress: progressCount,
                settings: settingsCount,
            },
        };
    },
});
