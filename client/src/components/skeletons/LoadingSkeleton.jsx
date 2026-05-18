/**
 * Lightweight loading skeleton using Tailwind CSS only.
 * No external dependencies.
 */

const MetricCardSkeleton = () => (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
        <div className="h-4 bg-[#E5E7EB] rounded w-24 mb-3 animate-pulse"></div>
        <div className="h-8 bg-[#E5E7EB] rounded w-16 animate-pulse"></div>
    </div>
)

const TableRowSkeleton = () => (
    <tr className="border-b border-[#F1F5F9]">
        <td className="px-6 py-4"><div className="h-4 bg-[#E5E7EB] rounded w-20 animate-pulse"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#E5E7EB] rounded w-32 animate-pulse"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#E5E7EB] rounded w-16 animate-pulse"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#E5E7EB] rounded w-12 animate-pulse"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#E5E7EB] rounded w-12 animate-pulse"></div></td>
        <td className="px-6 py-4"><div className="h-4 bg-[#E5E7EB] rounded w-16 animate-pulse"></div></td>
    </tr>
)

const TableSkeleton = () => (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <table className="w-full">
            <tbody>
                {[...Array(5)].map((_, i) => (
                    <TableRowSkeleton key={i} />
                ))}
            </tbody>
        </table>
    </div>
)

export { MetricCardSkeleton, TableRowSkeleton, TableSkeleton }
