function blocks(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function PostBody({ content }: { content: string }) {
  return (
    <div className="space-y-5 text-[15px] leading-7 text-neutral-700">
      {blocks(content).map((block, index) => {
        if (block.startsWith("### ")) {
          return (
            <h3 key={index} className="text-lg font-bold text-neutral-900">
              {block.slice(4)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="text-2xl font-bold tracking-tight text-neutral-900">
              {block.slice(3)}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line) => (
                <li key={line}>{line.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}
