import { createServerFn } from '@tanstack/react-start/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { STRIPE_COMMISSION_PERCENT } from '@/lib/stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const handleStripeWebhook = createServerFn({ method: 'POST' })
  .validator(async (request: Request) => {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')!
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch (err: any) {
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    return { body, event }
  })
  .handler(async ({ data }) => {
    const { event } = data

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const taskId = session.metadata?.task_id
      const buyerId = session.metadata?.buyer_id

      if (taskId && buyerId) {
        const { data: task } = await supabaseAdmin
          .from('tasks')
          .select('publisher_id, price')
          .eq('id', taskId)
          .single()

        if (task) {
          await supabaseAdmin
            .from('tasks')
            .update({
              status: 'ACCEPTED',
              collaborator_id: buyerId,
              stripe_payment_intent_id: session.payment_intent as string,
              accepted_at: new Date().toISOString(),
            })
            .eq('id', taskId)
        }
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const taskId = paymentIntent.metadata?.task_id

      if (taskId) {
        await supabaseAdmin
          .from('tasks')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', taskId)
          .eq('stripe_payment_intent_id', paymentIntent.id)
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const taskId = paymentIntent.metadata?.task_id

      if (taskId) {
        await supabaseAdmin
          .from('tasks')
          .update({ status: 'CANCELLED' })
          .eq('id', taskId)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })

export const POST = handleStripeWebhook
