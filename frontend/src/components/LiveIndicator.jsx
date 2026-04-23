export default function LiveIndicator({ label = 'LIVE' }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-success/10 border border-success/30">
      <span className="w-1.5 h-1.5 rounded-full bg-success dot-pulse" />
      <span className="text-[10px] font-bold tracking-widest text-success">{label}</span>
    </div>
  )
}