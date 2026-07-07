interface Props {
  title: string
  note: string
}

/** Temporary stand-in for pages built in later steps. */
export default function PlaceholderPage({ title, note }: Props) {
  return (
    <div className="mx-auto max-w-page rounded border border-outline-variant bg-surface-container-lowest p-8">
      <h1 className="text-headline-lg">{title}</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">{note}</p>
    </div>
  )
}
