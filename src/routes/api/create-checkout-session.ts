import { createServerFn } from '@tanstack/react-start/server'
import Stripe from 'stripe'
import { STRIPE_COMMISSION_PERCENT } from '@/lib/stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .validator(async (request: Request) => {
    const body = await request.json()
    return body as { taskId: string; taskTitle: string; price: number; buyerId: string }
  })
  .handler(async ({ data }) => {
    const { taskId, taskTitle, price, buyerId } = data

    const platformFee = Math.round(price * 100 * STRIPE_COMMISSION_PERCENT / 100)

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: taskTitle,
                description: `Pago por tarea en SOLVE`,
              },
              unit_amount: Math.round(price * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_intent_data: {
          metadata: {
            task_id: taskId,
            buyer_id: buyerId,
          },
        },
        metadata: {
          task_id: taskId,
          buyer_id: buyerId,
        },
        success_url: `${process.env.SITE_URL ?? 'http://localhost:3000'}/task/${taskId}?payment=success`,
        cancel_url: `${process.env.SITE_URL ?? 'http://localhost:3000'}/task/${taskId}?payment=cancelled`,
      })

      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  })

export const POST = createCheckoutSession
