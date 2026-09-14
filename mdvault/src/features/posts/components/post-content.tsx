/** Mirror the plain editor's lines and typography without interpreting Markdown. */
export function PostContent({ content }: { content: string }) {
	const lines = content.replace(/\r\n/g, "\n").split("\n");

	return (
		<div className="plain-text-content">
			{lines.map((line, index) => {
				const key = `${index}-${line.slice(0, 24)}`;

				return <p key={key}>{line || <br />}</p>;
			})}
		</div>
	);
}
