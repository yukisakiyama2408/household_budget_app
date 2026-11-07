/** Only constructs a local entry URL. The destination is validated by the receiving server page and actions. */
export function transactionEntryHref(id: number | "new", returnTo: string): string {
  return `/transactions/${id === "new" ? "new" : `${id}/edit`}?${new URLSearchParams({ returnTo })}`;
}

export function transactionImportHref(returnTo: string): string {
  return `/transactions/import?${new URLSearchParams({ returnTo })}`;
}
