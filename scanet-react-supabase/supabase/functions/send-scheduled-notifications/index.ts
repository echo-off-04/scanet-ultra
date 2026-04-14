import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FollowUp {
  id: string;
  contact_id: string;
  user_id: string;
  due_date: string;
  notes: string;
  contact: {
    first_name: string;
    last_name: string;
  };
}

interface Event {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
}

interface Opportunity {
  id: string;
  user_id: string;
  title: string;
  expected_close_date: string;
  amount: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekFromNowStr = weekFromNow.toISOString().split("T")[0];

    const notifications = [];

    const { data: followUps, error: followUpsError } = await supabase
      .from("contact_follow_ups")
      .select(`
        id,
        contact_id,
        user_id,
        due_date,
        notes,
        contact:contacts(first_name, last_name)
      `)
      .lte("due_date", todayStr)
      .eq("completed", false);

    if (followUpsError) {
      console.error("Error fetching follow-ups:", followUpsError);
    } else if (followUps && followUps.length > 0) {
      for (const followUp of followUps as any[]) {
        const contactName = `${followUp.contact.first_name} ${followUp.contact.last_name}`;
        notifications.push({
          user_id: followUp.user_id,
          type: "follow_up_due",
          category: "follow_ups",
          title: "⏰ Relance à effectuer",
          message: `Relance pour ${contactName} : ${followUp.notes || "Pas de note"}`,
          action_url: `/contacts/${followUp.contact_id}`,
          priority: "high",
          metadata: {
            contact_id: followUp.contact_id,
            contact_name: contactName,
            follow_up_note: followUp.notes,
          },
        });
      }
    }

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, user_id, name, start_date")
      .eq("start_date", tomorrowStr);

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
    } else if (events && events.length > 0) {
      for (const event of events as Event[]) {
        notifications.push({
          user_id: event.user_id,
          type: "event_starting_soon",
          category: "events",
          title: "📅 Événement imminent",
          message: `L'événement "${event.name}" commence demain`,
          action_url: `/events/${event.id}`,
          priority: "high",
          metadata: {
            event_id: event.id,
            event_name: event.name,
            event_date: event.start_date,
          },
        });
      }
    }

    const { data: opportunities, error: oppsError } = await supabase
      .from("contact_opportunities")
      .select("id, user_id, title, expected_close_date, amount")
      .gte("expected_close_date", todayStr)
      .lte("expected_close_date", weekFromNowStr)
      .in("status", ["prospect", "negotiation"]);

    if (oppsError) {
      console.error("Error fetching opportunities:", oppsError);
    } else if (opportunities && opportunities.length > 0) {
      for (const opp of opportunities as Opportunity[]) {
        notifications.push({
          user_id: opp.user_id,
          type: "opportunity_closing_soon",
          category: "opportunities",
          title: "📊 Clôture d'opportunité proche",
          message: `L'opportunité "${opp.title}"${opp.amount ? ` (${opp.amount}€)` : ""} arrive à échéance cette semaine`,
          action_url: `/opportunities/${opp.id}`,
          priority: "medium",
          metadata: {
            opportunity_id: opp.id,
            opportunity_title: opp.title,
            close_date: opp.expected_close_date,
            value: opp.amount,
          },
        });
      }
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated: notifications.length,
        message: `Successfully created ${notifications.length} notifications`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in send-scheduled-notifications:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
