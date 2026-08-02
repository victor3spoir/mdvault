export function LandingBackground() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
		>
			<img
				src="/landing-bg.svg"
				alt=""
				className="absolute inset-0 h-full w-full object-cover opacity-100 transition-opacity duration-300 dark:opacity-0"
			/>
			<img
				src="/landing-bg-dark.svg"
				alt=""
				className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 dark:opacity-100"
			/>
		</div>
	);
}
