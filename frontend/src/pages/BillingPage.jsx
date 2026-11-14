import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Crown, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { billingApi } from '../api/billing'
import { accountApi } from '../api/account'
import { getApiError } from '../utils/apiErrors'

export default function BillingPage() {
  const [params] = useSearchParams()
  const [subscription, setSubscription] = useState(null)
  const [customer, setCustomer] = useState({ first_name: '', last_name: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [plan, profile] = await Promise.all([
        billingApi.getSubscription(),
        accountApi.getProfile(),
      ])
      setSubscription(plan)
      setCustomer({
        first_name: profile.first_name || 'Mebrie',
        last_name: profile.last_name || 'Awoke',
        email: profile.email || '',
      })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const payment = params.get('payment')
    if (payment === 'success') setNotice('Payment verified. Your Premium subscription is active.')
    if (payment === 'failed') setError('The payment could not be verified. No Premium access was granted.')
    if (payment === 'pending') setNotice('Payment verification is still pending. Refresh this page in a moment.')
  }, [params])

  async function checkout(event) {
    event.preventDefault()
    setCheckoutLoading(true)
    setError('')
    setNotice('')
    try {
      const result = await billingApi.startCheckout(customer)
      window.location.assign(result.checkout_url)
    } catch (requestError) {
      setError(getApiError(requestError))
      setCheckoutLoading(false)
    }
  }

  return (
    <main className="billing-page">
      <header className="page-title-row"><span className="page-icon"><Crown size={20} /></span><div><span className="eyebrow">PROSPIRA PLANS</span><h1>Plans and billing</h1><p>Choose the AI usage allowance that fits your career workflow.</p></div></header>
      {error && <div className="form-error" role="alert">{error}</div>}
      {notice && <div className="success-notice" role="status"><Check size={15} /> {notice}</div>}
      {loading ? <div className="state-panel"><LoaderCircle className="spin" size={20} /> Loading your plan…</div> : <>
        <div className="billing-current-plan"><span><ShieldCheck size={17} /> Current plan</span><strong>{subscription?.premium_active ? 'Premium' : 'Free'}</strong>{subscription?.current_period_end && subscription?.premium_active && <small>Active until {new Date(subscription.current_period_end).toLocaleDateString()}</small>}</div>
        <div className="billing-plans">
          <article className="billing-plan-card"><span className="eyebrow">STARTER</span><h2>Free</h2><p className="billing-price">ETB 0 <small>/ always</small></p><ul><li><Check size={15} /> Resume builder and templates</li><li><Check size={15} /> PDF export</li><li><Check size={15} /> 10 AI requests per hour</li><li><Check size={15} /> Analysis history and cover letters</li></ul><span className="billing-plan-current">{subscription?.premium_active ? 'Available plan' : 'Your current plan'}</span></article>
          <article className="billing-plan-card billing-plan-premium"><span className="eyebrow"><Sparkles size={13} /> MORE ROOM TO GROW</span><h2>Premium</h2><p className="billing-price">{subscription?.premium_amount_etb ? `ETB ${subscription.premium_amount_etb}` : 'Price not set'} <small>/ 30 days</small></p><ul><li><Check size={15} /> Everything in Free</li><li><Check size={15} /> 100 AI requests per hour</li><li><Check size={15} /> Higher AI usage allowance</li><li><Check size={15} /> Verified payment through Chapa</li></ul>
            {subscription?.premium_active ? <span className="billing-plan-current">Premium is active</span> : subscription?.checkout_available ? <form onSubmit={checkout} className="billing-checkout-form">
              <label className="field"><span>First name</span><input value={customer.first_name} onChange={(event) => setCustomer((current) => ({ ...current, first_name: event.target.value }))} required /></label>
              <label className="field"><span>Last name</span><input value={customer.last_name} onChange={(event) => setCustomer((current) => ({ ...current, last_name: event.target.value }))} required /></label>
              <label className="field"><span>Email for receipt</span><input type="email" value={customer.email} onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))} required /></label>
              <button className="button button-primary" type="submit" disabled={checkoutLoading}>{checkoutLoading ? <LoaderCircle className="spin" size={15} /> : <Crown size={15} />} {checkoutLoading ? 'Preparing secure checkout…' : 'Upgrade with Chapa'}</button>
            </form> : <p className="billing-unavailable">Premium checkout is not configured yet. The site owner must add Chapa credentials and a subscription price in the backend environment.</p>}
          </article>
        </div>
        <p className="billing-renewal-note">Premium lasts 30 days from verified payment. It does not automatically renew; you can purchase another period when it expires. Payments are confirmed by the server with Chapa before Premium access is enabled.</p>
      </>}
    </main>
  )
}
