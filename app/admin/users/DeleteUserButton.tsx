'use client';

import { useState } from 'react';

export default function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [deleting, setDeleting] = useState(false);

  async function deleteUser() {
    const ok = window.confirm(`Delete user ${email}? This removes the login account only.`);
    if (!ok) return;
    setDeleting(true);
    const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    if (response.ok) window.location.reload();
    else {
      alert(await response.text());
      setDeleting(false);
    }
  }

  return <button className="btn-danger px-3 py-2 text-sm" disabled={deleting} onClick={deleteUser}>{deleting ? 'Deleting...' : 'Delete'}</button>;
}
