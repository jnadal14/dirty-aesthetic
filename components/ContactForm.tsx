'use client'

import { AnimatePresence, motion } from 'motion/react'
import Button from './Button'
import { useFormspree } from './useFormspree'
import { Stagger, StaggerItem } from './motion/Stagger'
import { site } from '@/lib/site'

const fields = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'subject', label: 'Subject', type: 'text' },
  { name: 'project_start_date', label: 'Project Start Date', type: 'date' },
] as const

/** Bookings form, shared by the homepage and the contact page. */
export default function ContactForm({ className = '' }: { className?: string }) {
  const { state, onSubmit } = useFormspree()
  return (
    <div className={`mx-auto w-full max-w-xl text-left ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {state === 'sent' ? (
          <motion.p key="sent" role="status" className="py-12 text-center text-xl text-bone"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            Message sent. Thanks, we&rsquo;ll be in touch soon.
          </motion.p>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} exit={{ opacity: 0, y: -12 }}>
            <Stagger className="grid gap-4">
              {fields.map(f => (
                <StaggerItem key={f.name}>
                  <label className="block">
                    <span className="field-label">{f.label}</span>
                    <input className="field" type={f.type} name={f.name} required={'required' in f && f.required} />
                  </label>
                </StaggerItem>
              ))}
              <StaggerItem>
                <label className="block">
                  <span className="field-label">Project Details</span>
                  <textarea className="field" name="project_details" rows={4} placeholder="Venue, event type, expected capacity, other acts, etc." />
                </label>
              </StaggerItem>
              <StaggerItem>
                <label className="block">
                  <span className="field-label">Message</span>
                  <textarea className="field" name="message" rows={4} required />
                </label>
              </StaggerItem>
              <StaggerItem className="pt-2">
                <Button type="submit" variant="ghost" disabled={state === 'sending'} className="w-full">
                  {state === 'sending' ? 'Sending…' : 'Send Message'}
                </Button>
                {state === 'error' && (
                  <p role="alert" className="mt-3 text-center text-sm text-sun">
                    Something went wrong. Please try again or email us at <a className="prose-link" href={`mailto:${site.email}`}>{site.email}</a>.
                  </p>
                )}
              </StaggerItem>
            </Stagger>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
