
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendReportRequest {
  name: string;
  email: string;
  receiptData: any;
  interestType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, receiptData, interestType }: SendReportRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Ilovenuacha@gmail.com",
      to: [email],
      subject: `${name}, Your Nuacha Receipt Report is Ready`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Your Receipt Report</h1>
          <p>Hello ${name},</p>
          <p>Thank you for trying Nuacha's receipt scanning feature. Here's your expense report:</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Receipt Details</h2>
            <p>Amount: ${receiptData.amount || 'N/A'}</p>
            <p>Date: ${receiptData.date || 'N/A'}</p>
            <p>Vendor: ${receiptData.place || 'N/A'}</p>
            <p>Description: ${receiptData.description || 'N/A'}</p>
          </div>

          ${getInterestTypeContent(interestType)}

          <p>Ready to streamline your expense management?</p>
          <a href="https://nuacha.com" style="display: inline-block; background: #5A7684; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Explore Nuacha Solutions
          </a>
        </div>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-receipt-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getInterestTypeContent(interestType: string): string {
  switch (interestType) {
    case 'personal':
      return `<p>Looking to simplify your personal finances? Nuacha offers intuitive tools for tracking your daily expenses.</p>`;
    case 'family':
      return `<p>Managing family expenses can be complex. Nuacha helps you keep track of multiple households with ease.</p>`;
    case 'small-business':
      return `<p>As a small business owner, you need efficient expense tracking. Nuacha provides powerful tools to streamline your business finances.</p>`;
    case 'large-business':
      return `<p>For larger organizations, Nuacha offers scalable solutions to manage expenses across multiple departments.</p>`;
    default:
      return `<p>Discover how Nuacha can transform your expense management experience.</p>`;
  }
}

serve(handler);
