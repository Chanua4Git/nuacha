import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── get-nis-classes ──
    if (action === "get-nis-classes") {
      const effectiveDate =
        body.effective_date || new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("nis_earnings_classes")
        .select("*")
        .eq("is_active", true)
        .lte("effective_date", effectiveDate)
        .order("min_weekly_earnings", { ascending: true });

      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ classes: data });
    }

    // ── calculate-nis ──
    if (action === "calculate-nis") {
      let weeklyEarnings: number;

      if (typeof body.weekly_earnings === "number") {
        weeklyEarnings = body.weekly_earnings;
      } else if (
        typeof body.hourly_rate === "number" &&
        typeof body.hours_worked === "number"
      ) {
        weeklyEarnings = body.hourly_rate * body.hours_worked;
      } else {
        return jsonResponse(
          {
            error:
              "Provide either weekly_earnings or both hourly_rate and hours_worked",
          },
          400
        );
      }

      if (weeklyEarnings < 0) {
        return jsonResponse({ error: "Earnings cannot be negative" }, 400);
      }

      const grossPay = weeklyEarnings;

      // $200/week threshold per T&T NIS law
      if (weeklyEarnings <= 200) {
        return jsonResponse({
          nis_applicable: false,
          weekly_earnings: Math.round(weeklyEarnings * 100) / 100,
          nis_class: null,
          employee_contribution: 0,
          employer_contribution: 0,
          gross_pay: Math.round(grossPay * 100) / 100,
          net_pay_after_nis: Math.round(grossPay * 100) / 100,
        });
      }

      const effectiveDate =
        body.effective_date || new Date().toISOString().split("T")[0];

      const { data: classes, error } = await supabase
        .from("nis_earnings_classes")
        .select("*")
        .eq("is_active", true)
        .lte("effective_date", effectiveDate)
        .order("min_weekly_earnings", { ascending: true });

      if (error) return jsonResponse({ error: error.message }, 500);

      if (!classes || classes.length === 0) {
        return jsonResponse(
          { error: "No NIS earnings classes found for the given date" },
          404
        );
      }

      // Find matching class
      let matched = classes.find(
        (c: any) =>
          weeklyEarnings >= c.min_weekly_earnings &&
          weeklyEarnings <= c.max_weekly_earnings
      );

      // If earnings exceed all classes, use the highest
      if (!matched) {
        matched = classes[classes.length - 1];
      }

      const employeeContribution = matched.employee_contribution;
      const employerContribution = matched.employer_contribution;

      return jsonResponse({
        nis_applicable: true,
        weekly_earnings: Math.round(weeklyEarnings * 100) / 100,
        nis_class: matched.earnings_class,
        employee_contribution: employeeContribution,
        employer_contribution: employerContribution,
        gross_pay: Math.round(grossPay * 100) / 100,
        net_pay_after_nis:
          Math.round((grossPay - employeeContribution) * 100) / 100,
      });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }
});
