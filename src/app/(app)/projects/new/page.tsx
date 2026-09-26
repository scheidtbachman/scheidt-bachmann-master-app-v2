import PageHeader from '@/components/PageHeader'

export default function Page() {
  return (
    <div>
      <PageHeader title="New Project" subtitle="Module ready to be built" />
      <div className="bg-white border rounded-lg p-12 text-center text-slate-400">
        This module is ready. Content coming soon.
      </div>
    </div>
  )
}
