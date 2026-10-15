'use client'

import { useState } from 'react'
import { site } from '@/lib/site'

export type FormState = 'idle' | 'sending' | 'sent' | 'error'

/** Posts a form to Formspree in the background and reports how it went. */
export function useFormspree(prepare?: (data: FormData) => void) {
  const [state, setState] = useState<FormState>('idle')
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    prepare?.(data)
    setState('sending')
    try {
      const res = await fetch(site.formspree, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(String(res.status))
      setState('sent')
    } catch {
      setState('error')
    }
  }
  return { state, onSubmit }
}
