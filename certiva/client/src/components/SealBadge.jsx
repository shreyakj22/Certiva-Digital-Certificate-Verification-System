export default function SealBadge({ valid }) {
  const color = valid ? "#2f6f4f" : "#a6362f";

  return (
    <svg className="seal" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill={color} opacity="0.12" />
      <circle cx="50" cy="50" r="38" stroke={color} strokeWidth="2.5" strokeDasharray="4 5" />
      <circle cx="50" cy="50" r="30" fill={color} opacity="0.15" />
      {valid ? (
        <path
          d="M35 51l10 10 20-22"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : (
        <path
          d="M38 38l24 24M62 38L38 62"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}
