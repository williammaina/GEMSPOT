import { useState } from 'react';
import { BadgeCheck, Send } from 'lucide-react';
import styles from '../../styles/components/shared/OwnerClaim.module.css';
import { useApp } from '../../library/contexts/AppContext.js';
import { trackEvent } from '../../library/helpers/analytics.js';

export function OwnerClaim({ place }) {
  const { user, pushToast } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  if (!place) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      pushToast?.('Name and phone required', 'error');
      return;
    }
    const claim = {
      placeId: place.place_id ?? place.id,
      placeTitle: place.title || place.name,
      name: name.trim(),
      phone: phone.trim(),
      note: note.trim(),
      userEmail: user?.email || null,
      at: Date.now(),
      status: 'pending',
    };
    try {
      const key = 'gemspot-owner-claims';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      prev.unshift(claim);
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 50)));
    } catch {
      /* */
    }
    trackEvent('owner_claim', { placeId: claim.placeId });
    setSent(true);
    pushToast?.('Claim submitted — we will review', 'success');
  };

  if (sent) {
    return (
      <div className={styles.Done}>
        <BadgeCheck size={18} /> Claim received for review
      </div>
    );
  }

  return (
    <section className={styles.Shell}>
      <button type="button" className={styles.Trigger} onClick={() => setOpen((v) => !v)}>
        <BadgeCheck size={16} /> Own this place? Claim it
      </button>
      {open && (
        <form className={styles.Form} onSubmit={submit}>
          <p className={styles.Hint}>
            Verified owners can update hours, menu, and logistics.
          </p>
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Phone (M-Pesa ready)
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <label>
            Note (optional)
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </label>
          <button type="submit" className={styles.Submit}>
            <Send size={15} /> Submit claim
          </button>
        </form>
      )}
    </section>
  );
}
