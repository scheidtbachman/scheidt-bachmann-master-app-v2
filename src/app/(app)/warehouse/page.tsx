import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'
import { Warehouse, Search, AlertTriangle } from 'lucide-react'

export default async function WarehousePage({
  searchParams,
}: {
  searchParams: { q?: string; low?: string }
}) {
  const supabase = await createClient()
  const query = searchParams.q?.trim() || ''
  const lowStockFilter = searchParams.low === '1'

  let request = supabase
    .from('warehouse_items')
    .select('*')
    .order('description', { ascending: true })

  if (query) {
    request = request.or(
      `description.ilike.%${query}%,part_number.ilike.%${query}%,category.ilike.%${query}%,serial_number.ilike.%${query}%`
    )
  }

  const { data: items } = await request

  const filtered = lowStockFilter
    ? items?.filter((i) => i.quantity <= i.min_stock)
    : items

  const lowStockCount = items?.filter((i) => i.quantity <= i.min_stock).length || 0
  const totalValue = items?.reduce((sum, i) => sum + (i.quantity * (i.cost || 0)), 0) || 0

  return (
    <div>
      <PageHeader
        title="Warehouse"
        subtitle="Inventory & stock management"
        actionLabel="Add Item"
        actionHref="/warehouse/new"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Items</div>
          <div className="text-2xl font-bold">{items?.length ?? 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Low Stock</div>
          <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {lowStockCount}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Value</div>
          <div className="text-lg md:text-2xl font-bold">AED {totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/warehouse"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
            !lowStockFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({items?.length ?? 0})
        </Link>
        <Link
          href="/warehouse?low=1"
          className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 ${
            lowStockFilter ? 'bg-red-600 text-white border-red-600' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle size={12} /> Low Stock ({lowStockCount})
        </Link>
      </div>

      {/* Search */}
      <form className="mb-6 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by description, part number, category..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>

      {/* Empty / List */}
      {!filtered?.length ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Warehouse className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 mb-4">
            {query || lowStockFilter ? 'No items match your filter' : 'Warehouse is empty'}
          </p>
          <Link href="/warehouse/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Add first item
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Part No.</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Qty</th>
                  <th className="text-left px-4 py-3 font-medium">Min</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const isLow = i.quantity <= i.min_stock
                  return (
                    <tr key={i.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{i.part_number || '—'}</td>
                      <td className="px-4 py-3 font-medium">{i.description}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{i.category || '—'}</td>
                      <td className="px-4 py-3">{i.quantity} {i.uom}</td>
                      <td className="px-4 py-3 text-slate-500">{i.min_stock}</td>
                      <td className="px-4 py-3 text-slate-600">{i.rack_location || '—'}</td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                            <AlertTriangle size={10} /> Low
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}