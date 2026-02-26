export function CommandShortcut({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1.5">
      {keys.map(key => (
        <kbd
          key={key}
          className="px-1 py-0.5 text-[10px] leading-none rounded bg-white/10 text-white/50 font-sans"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

export default CommandShortcut;
