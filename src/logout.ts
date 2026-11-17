// Push cleanup is best effort. It must never prevent local sign-out.
async function settlesWithin(action: () => Promise<unknown>, milliseconds: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(action).then(() => true, () => false),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), milliseconds); }),
    ]);
  } finally { clearTimeout(timer); }
}
export async function completeLogout(detach: () => Promise<unknown>, signOut: () => Promise<unknown>, timeout = {push: 1500, auth: 4000}) {
  await settlesWithin(detach, timeout.push);
  const signedOut = await settlesWithin(signOut, timeout.auth);
  // Reload destroys a stuck SDK/network operation before another login starts.
  return { reloadRequired: !signedOut };
}
