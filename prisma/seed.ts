import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    tls: {
      rejectUnauthorized: false,
    },
  }),
});

async function main() {
  // Create notification templates
  const templates = [
    {
      name: "appointment-reminder-24h",
      type: "appointment",
      subject: "Appointment Reminder - 24 Hours Notice",
      body: `Dear {{customerName}},

This is a friendly reminder that you have an appointment scheduled for tomorrow.

Service: {{serviceName}}
Business: {{businessName}}
Date: {{date}}
Time: {{time}}
Staff: {{staffName}}

Please arrive 10 minutes early. If you need to reschedule or cancel, please contact us.

Best regards,
{{businessName}} Team`,
      variables: [
        "customerName",
        "serviceName",
        "businessName",
        "date",
        "time",
        "staffName",
      ],
    },
    {
      name: "appointment-reminder-1h",
      type: "appointment",
      subject: "Appointment Reminder - 1 Hour Notice",
      body: `Dear {{customerName}},

Your appointment is coming up in 1 hour.

Service: {{serviceName}}
Business: {{businessName}}
Date: {{date}}
Time: {{time}}
Staff: {{staffName}}

Please arrive on time. If you're running late, please let us know.

Best regards,
{{businessName}} Team`,
      variables: [
        "customerName",
        "serviceName",
        "businessName",
        "date",
        "time",
        "staffName",
      ],
    },
    {
      name: "staff-appointment-reminder-1h",
      type: "appointment",
      subject: "Staff Appointment Reminder - 1 Hour Notice",
      body: `Dear {{staffName}},

You have an appointment in 1 hour.

Customer: {{customerName}}
Service: {{serviceName}}
Business: {{businessName}}
Date: {{date}}
Time: {{time}}

Please prepare for the appointment.

Best regards,
{{businessName}} Team`,
      variables: [
        "staffName",
        "customerName",
        "serviceName",
        "businessName",
        "date",
        "time",
      ],
    },
    {
      name: "appointment-cancelled",
      type: "appointment",
      subject: "Appointment Cancelled",
      body: `Dear {{customerName}},

Your appointment has been cancelled.

Service: {{serviceName}}
Business: {{businessName}}
Date: {{date}}
Time: {{time}}

If you'd like to reschedule, please contact us.

Best regards,
{{businessName}} Team`,
      variables: [
        "customerName",
        "serviceName",
        "businessName",
        "date",
        "time",
      ],
    },
    {
      name: "appointment-rescheduled",
      type: "appointment",
      subject: "Appointment Rescheduled",
      body: `Dear {{customerName}},

Your appointment has been rescheduled.

Service: {{serviceName}}
Business: {{businessName}}
New Date: {{newDate}}
New Time: {{newTime}}
Staff: {{staffName}}

Please confirm this new time works for you.

Best regards,
{{businessName}} Team`,
      variables: [
        "customerName",
        "serviceName",
        "businessName",
        "newDate",
        "newTime",
        "staffName",
      ],
    },
    {
      name: "daily-appointment-summary",
      type: "summary",
      subject: "Daily Appointment Summary - {{date}}",
      body: `Dear {{staffName}},

Here is your appointment summary for today:

You have {{appointmentsCount}} appointment(s) scheduled:

{{appointmentsList}}

Please review your schedule and prepare accordingly.

Best regards,
Your Scheduling System`,
      variables: ["staffName", "date", "appointmentsCount", "appointmentsList"],
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
  }

  console.log("Notification templates seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
