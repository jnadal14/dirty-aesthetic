'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import Button from '../Button'
import { useFormspree } from '../useFormspree'
import { site } from '@/lib/site'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const csvCell = (v: FormDataEntryValue | null) => {
  const s = (v == null ? '' : String(v)).trim()
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Preorder form. Emails the band through Formspree and packs each preorder
 * into a single CSV row (order_csv) so it pastes straight into a spreadsheet.
 */
export default function MerchForm() {
  const [ship, setShip] = useState(false)
  const { state, onSubmit } = useFormspree(data => {
    const cols = ['Timestamp', 'Name', 'Email', 'Item', 'Price', 'Size', 'Quantity', 'Delivery', 'Address']
    const vals = [new Date().toISOString(), ...['name', 'email', 'item', 'price', 'size', 'quantity', 'delivery', 'address'].map(k => data.get(k))]
    data.set('order_csv', cols.map(csvCell).join(',') + '\n' + vals.map(csvCell).join(','))
  })

  if (state === 'sent') {
    return (
      <motion.p role="status" className="mt-8 rounded-sm border border-accent/40 bg-accent/10 p-5 text-bone"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        Preorder received. We&apos;ll email you soon. Thank you!
      </motion.p>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid max-w-sm gap-3">
      <input type="hidden" name="_subject" value="New Merch Preorder Dirty Aesthetic" />
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <input type="hidden" name="item" value="First Drop Tee $35" />
      <input type="hidden" name="price" value="$35" />

      <label className="sr-only" htmlFor="merch-name">Name</label>
      <input className="field" type="text" name="name" id="merch-name" placeholder="Name" required autoComplete="name" />
      <label className="sr-only" htmlFor="merch-email">Email</label>
      <input className="field" type="email" name="email" id="merch-email" placeholder="Email" required autoComplete="email" />

      <div className="grid grid-cols-[1.4fr_1fr] gap-3">
        <label className="sr-only" htmlFor="merch-size">Size</label>
        <select className="field" name="size" id="merch-size" required defaultValue="">
          <option value="" disabled>Size</option>
          {SIZES.map(s => <option key={s}>{s}</option>)}
        </select>
        <label className="sr-only" htmlFor="merch-qty">Quantity</label>
        <input className="field text-center" type="number" name="quantity" id="merch-qty" min={1} max={20} defaultValue={1} required aria-label="Quantity" />
      </div>

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">Delivery</legend>
        {[
          { value: 'Local pickup (Vancouver)', label: <>Pickup <small className="text-[.75em] text-sand">Vancouver</small></>, isShip: false },
          { value: 'Ship to me', label: <>Ship</>, isShip: true },
        ].map(o => (
          <label key={o.value} className="relative cursor-pointer">
            <input type="radio" name="delivery" value={o.value} defaultChecked={!o.isShip} onChange={() => setShip(o.isShip)} className="peer sr-only" />
            <span className="flex min-h-12 items-center justify-center gap-1.5 rounded-full border border-bone/14 bg-white/4 px-4 transition-colors peer-checked:border-accent peer-checked:bg-accent/12 peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
              {o.label}
            </span>
            {ship === o.isShip && (
              <motion.span layoutId="delivery-pick" className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-accent/60" />
            )}
          </label>
        ))}
      </fieldset>

      <AnimatePresence initial={false}>
        {ship && (
          <motion.label htmlFor="merch-address" className="block overflow-hidden"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <span className="sr-only">Shipping address</span>
            <textarea className="field" name="address" id="merch-address" rows={2} placeholder="Shipping address" required />
          </motion.label>
        )}
      </AnimatePresence>

      <div className="mt-2">
        <Button type="submit" variant="ghost" disabled={state === 'sending'} className="w-full">
          {state === 'sending' ? 'Sending…' : 'Preorder'}
        </Button>
      </div>
      {state === 'error' && (
        <p role="status" className="text-sm text-sun">
          Something went wrong. Please try again or email us at <a className="prose-link" href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      )}
    </form>
  )
}
