import React from 'react';
import { Package, AlertCircle, Check, Boxes } from 'lucide-react';

export default function SuppliesTable({ supplies }) {
  if (!Array.isArray(supplies) || supplies.length === 0) {
    return (
      <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 text-xs text-zinc-500">
        No specific supply recommendations generated.
      </div>
    );
  }

  const totalItems = supplies.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const shortages = supplies.filter((item) => (item.shortage || 0) > 0);

  return (
    <div className="rounded-xl bg-[#141416] border border-zinc-800/80 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-400">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">
                Recommended Relief Supplies
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                ({supplies.length} categories)
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              Allocated inventory from regional supply stockpile
            </span>
          </div>
        </div>

        {shortages.length > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{shortages.length} item(s) below requested quota</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
            <Check className="w-3.5 h-3.5" />
            <span>Full inventory match available</span>
          </div>
        )}
      </div>

      {/* Supplies Grid / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
              <th className="pb-2.5 pl-1">Supply Item</th>
              <th className="pb-2.5 text-right">Dispatch Qty</th>
              <th className="pb-2.5 text-right hidden sm:table-cell">Available Stock</th>
              <th className="pb-2.5 text-right pr-1">Fulfillment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {supplies.map((item, idx) => {
              const hasShortage = (item.shortage || 0) > 0;
              const fulfillPct = item.requested_quantity > 0
                ? Math.min(100, Math.round((item.quantity / item.requested_quantity) * 100))
                : 100;

              return (
                <tr key={item.item_id || idx} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-2.5 pl-1 font-sans font-medium text-zinc-200">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  
                  <td className="py-2.5 text-right font-semibold text-zinc-100">
                    {item.quantity.toLocaleString()}
                    <span className="text-[11px] font-normal text-zinc-400 font-sans ml-1">
                      {item.unit}
                    </span>
                  </td>

                  <td className="py-2.5 text-right text-zinc-400 hidden sm:table-cell">
                    {item.available_quantity?.toLocaleString()}
                    <span className="text-[10px] text-zinc-500 font-sans ml-1">stock</span>
                  </td>

                  <td className="py-2.5 text-right pr-1">
                    {hasShortage ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-sans">
                        <span>Short by {item.shortage}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-sans">
                        <span>100% Ready</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer totals */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/70">
        <span>Verified Logistics Database (`logistics/vektor.db`)</span>
        <span className="font-mono text-zinc-300">
          Total units to stage: <strong>{totalItems.toLocaleString()}</strong>
        </span>
      </div>
    </div>
  );
}
