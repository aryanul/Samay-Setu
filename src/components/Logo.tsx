type LogoProps = {
  size?: number;
  gold?: string;
  className?: string;
  title?: string;
};

export default function Logo({
  size = 36,
  gold = "#C9A96E",
  className,
  title = "Samay Setu",
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <path
        d="M8 24 C8 14, 18 10, 18 18 C18 26, 28 22, 28 12"
        stroke={gold}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="24" r="2.5" fill={gold} />
      <circle cx="28" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}
