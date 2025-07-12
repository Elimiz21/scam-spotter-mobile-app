import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SubscriptionEmail } from './_templates/subscription-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionEmailRequest {
  email: string
  planType: string
  amount: string
  isNewSubscription: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  try {
    const { email, planType, amount, isNewSubscription }: SubscriptionEmailRequest = await req.json()

    const html = await renderAsync(
      React.createElement(SubscriptionEmail, {
        email,
        planType,
        amount,
        isNewSubscription,
      })
    )

    const { error } = await resend.emails.send({
      from: 'ScamShield <subscriptions@resend.dev>',
      to: [email],
      subject: isNewSubscription 
        ? `Welcome to ScamShield ${planType}` 
        : `Your ScamShield subscription has been updated`,
      html,
    })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in send-subscription-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})